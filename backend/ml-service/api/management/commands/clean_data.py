"""
TravelIO — Data Cleaning Management Command
Preprocesses raw CSVs into clean, normalized datasets.
"""
import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Clean and preprocess raw dataset CSVs for ML model consumption'

    def handle(self, *args, **options):
        os.makedirs(settings.CLEANED_DATA_DIR, exist_ok=True)

        self.clean_destinations()
        self.clean_budget()
        self.clean_safety()
        self.clean_global_trends()

        self.stdout.write(self.style.SUCCESS('\n✅ All datasets cleaned and saved!'))

    def clean_destinations(self):
        """Merge and clean destination datasets."""
        self.stdout.write('Cleaning destinations...')

        places_path = os.path.join(settings.DATASETS_DIR, 'destinations', 'places.csv')
        top_places_path = os.path.join(settings.DATASETS_DIR, 'destinations', 'Top Indian Places to Visit.csv')

        dfs = []

        if os.path.exists(places_path):
            df_places = pd.read_csv(places_path)
            df_places.columns = df_places.columns.str.strip().str.lower().str.replace(' ', '_')
            dfs.append(df_places)

        if os.path.exists(top_places_path):
            df_top = pd.read_csv(top_places_path)
            df_top.columns = df_top.columns.str.strip().str.lower().str.replace(' ', '_')

            # Rename columns to match
            col_map = {
                'zone': 'zone', 'state': 'state', 'city': 'city', 'name': 'name',
                'type': 'type', 'establishment_year': 'establishment_year',
                'time_needed_to_visit_in_hrs': 'visit_hours',
                'google_review_rating': 'google_rating',
                'entrance_fee_in_inr': 'entrance_fee_inr',
                'significance': 'interest',
                'best_time_to_visit': 'best_time',
                'number_of_google_review_in_lakhs': 'review_count_lakhs',
            }
            df_top = df_top.rename(columns=col_map)
            dfs.append(df_top)

        if dfs:
            merged = pd.concat(dfs, ignore_index=True)
            merged = merged.drop_duplicates(subset=['name', 'city'], keep='first')
            merged = merged.dropna(subset=['name'])

            output_path = os.path.join(settings.CLEANED_DATA_DIR, 'destinations_clean.csv')
            merged.to_csv(output_path, index=False)
            self.stdout.write(f'  → {len(merged)} destinations saved to destinations_clean.csv')

    def clean_budget(self):
        """Clean and normalize budget/hotel data."""
        self.stdout.write('Cleaning budget data...')

        hotel_path = os.path.join(settings.DATASETS_DIR, 'budget', 'final_hotel.csv')
        cost_path = os.path.join(settings.DATASETS_DIR, 'budget', 'travel cost.csv')

        if os.path.exists(cost_path):
            df_cost = pd.read_csv(cost_path)
            df_cost.columns = df_cost.columns.str.strip().str.lower().str.replace(' ', '_')

            # Parse cost ranges (e.g., "500 -5000" → min=500, max=5000, avg=2750)
            if 'accomdation_cost' in df_cost.columns:
                df_cost = df_cost.rename(columns={
                    'accomdation_cost': 'cost_range',
                    'accomadation_type': 'accommodation_type',
                })
            elif 'accommodation_cost' in df_cost.columns:
                df_cost = df_cost.rename(columns={'accommodation_cost': 'cost_range'})

            if 'cost_range' in df_cost.columns:
                def parse_range(val):
                    try:
                        parts = str(val).replace(',', '').split('-')
                        low = float(parts[0].strip())
                        high = float(parts[1].strip()) if len(parts) > 1 else low
                        return low, high, (low + high) / 2
                    except (ValueError, IndexError):
                        return None, None, None

                parsed = df_cost['cost_range'].apply(parse_range)
                df_cost['cost_min'] = parsed.apply(lambda x: x[0])
                df_cost['cost_max'] = parsed.apply(lambda x: x[1])
                df_cost['cost_avg'] = parsed.apply(lambda x: x[2])
                df_cost = df_cost.dropna(subset=['cost_avg'])

            output_path = os.path.join(settings.CLEANED_DATA_DIR, 'budget_clean.csv')
            df_cost.to_csv(output_path, index=False)
            self.stdout.write(f'  → {len(df_cost)} budget entries saved to budget_clean.csv')

    def clean_safety(self):
        """Clean crime statistics data and compute safety scores."""
        self.stdout.write('Cleaning safety data...')

        safety_path = os.path.join(settings.DATASETS_DIR, 'safety', '01_District_wise_crimes_committed_IPC_2001_2012.csv')

        if os.path.exists(safety_path):
            df = pd.read_csv(safety_path)
            df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('/', '_')

            # Rename for consistency
            col_map = {'state_ut': 'state', 'total_ipc_crimes': 'total_crimes'}
            df = df.rename(columns=col_map)

            # Aggregate by district (average across years)
            group_cols = ['state', 'district']
            numeric_cols = df.select_dtypes(include='number').columns.tolist()
            if 'year' in numeric_cols:
                numeric_cols.remove('year')

            df_agg = df.groupby(group_cols)[numeric_cols].mean().reset_index()

            # Compute safety score (inverse of total crimes, normalized 0-100)
            if 'total_crimes' in df_agg.columns:
                max_crimes = df_agg['total_crimes'].max()
                df_agg['safety_score'] = ((1 - df_agg['total_crimes'] / max_crimes) * 100).round(1)

                # Classify risk levels
                df_agg['risk_level'] = pd.cut(
                    df_agg['safety_score'],
                    bins=[0, 40, 70, 100],
                    labels=['High', 'Medium', 'Low']
                )

            output_path = os.path.join(settings.CLEANED_DATA_DIR, 'safety_clean.csv')
            df_agg.to_csv(output_path, index=False)
            self.stdout.write(f'  → {len(df_agg)} districts saved to safety_clean.csv')

    def clean_global_trends(self):
        """Clean global tourism trends data."""
        self.stdout.write('Cleaning global trends...')

        trends_path = os.path.join(settings.DATASETS_DIR, 'budget', 'global_tourism_travel_trends.csv')

        if os.path.exists(trends_path):
            df = pd.read_csv(trends_path)
            df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

            output_path = os.path.join(settings.CLEANED_DATA_DIR, 'global_trends_clean.csv')
            df.to_csv(output_path, index=False)
            self.stdout.write(f'  → {len(df)} trend records saved to global_trends_clean.csv')
