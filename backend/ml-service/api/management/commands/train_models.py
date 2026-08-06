"""
TravelIO — Model Training Management Command
Trains all sklearn ML models (not the CNN — that has its own script).
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Train all ML models (KNN Recommender, Budget Forecaster, Safety Scorer)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('\n🚀 TravelIO Model Training Pipeline\n'))

        self.train_recommender()
        self.train_budget()
        self.train_safety()

        self.stdout.write(self.style.SUCCESS('\n✅ All models trained and saved!\n'))

    def train_recommender(self):
        self.stdout.write('Training KNN Recommender...')
        try:
            from ml.recommender import TripRecommender
            data_path = os.path.join(settings.CLEANED_DATA_DIR, 'destinations_clean.csv')
            if not os.path.exists(data_path):
                self.stdout.write(self.style.WARNING('  ⚠ destinations_clean.csv not found. Run clean_data first.'))
                return
            recommender = TripRecommender()
            count = recommender.train(data_path)
            self.stdout.write(self.style.SUCCESS(f'  ✓ Trained on {count} destinations'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  ✗ Error: {e}'))

    def train_budget(self):
        self.stdout.write('Training Budget Forecaster...')
        try:
            from ml.budget_forecaster import BudgetForecaster
            data_path = os.path.join(settings.CLEANED_DATA_DIR, 'budget_clean.csv')
            if not os.path.exists(data_path):
                self.stdout.write(self.style.WARNING('  ⚠ budget_clean.csv not found. Run clean_data first.'))
                return
            forecaster = BudgetForecaster()
            r2, mae, count = forecaster.train(data_path)
            self.stdout.write(self.style.SUCCESS(f'  ✓ Trained on {count} entries (R²={r2:.3f}, MAE=₹{mae:.0f})'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  ✗ Error: {e}'))

    def train_safety(self):
        self.stdout.write('Training Safety Scorer...')
        try:
            from ml.safety_scorer import SafetyScorer
            data_path = os.path.join(settings.CLEANED_DATA_DIR, 'safety_clean.csv')
            if not os.path.exists(data_path):
                self.stdout.write(self.style.WARNING('  ⚠ safety_clean.csv not found. Run clean_data first.'))
                return
            scorer = SafetyScorer()
            accuracy, count = scorer.train(data_path)
            self.stdout.write(self.style.SUCCESS(f'  ✓ Trained on {count} districts (Accuracy={accuracy:.1%})'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  ✗ Error: {e}'))
