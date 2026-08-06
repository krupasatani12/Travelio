import pandas as pd
import numpy as np
import os
import pickle
import re
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'dataset'))
MODULE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'Module'))

MODEL_PATH = os.path.join(MODULE_DIR, 'poly_budget_v2.pkl')

def train_budget_forecaster():
    print("Starting Budget Forecaster V2 Training with Train.csv...")
    
    # 1. Load Data
    train_csv_path = os.path.join(DATASET_DIR, 'vacation-price-prediction', 'Train.csv')
    
    try:
        df = pd.read_csv(train_csv_path)
    except Exception as e:
        print(f"Error reading dataset: {e}")
        return
        
    print(f"Loaded {len(df)} initial itinerary records.")
    df = df.dropna(subset=['Itinerary', 'Per Person Price'])
    
    # 2. Extract Month
    df['Travel Date'] = pd.to_datetime(df['Travel Date'], format='%d-%m-%Y', errors='coerce')
    
    # 3. Parse Itinerary and Explode
    records = []
    for idx, row in df.iterrows():
        itinerary = str(row['Itinerary'])
        price = float(row['Per Person Price'])
        month = row['Travel Date'].month if pd.notna(row['Travel Date']) else np.random.randint(1, 13)
        
        parts = itinerary.split(' . ')
        total_nights = 0
        cities = []
        for part in parts:
            match = re.match(r'(\d+)N\s+(.*)', part.strip())
            if match:
                nights = int(match.group(1))
                city = match.group(2).strip()
                total_nights += nights
                if nights > 0:
                    cities.append(city)
                    
        if total_nights > 0:
            daily_price = price / total_nights
            # Avoid duplicate cities in the same trip, taking set
            for city in set(cities):
                records.append({
                    'place': city,
                    'base_daily_cost': daily_price,
                    'month': month
                })

    df_parsed = pd.DataFrame(records)
    print(f"Exploded into {len(df_parsed)} city-level cost records.")
    
    # Drop extreme outliers (bottom 1% and top 1%) to make the model robust
    lower_bound = df_parsed['base_daily_cost'].quantile(0.01)
    upper_bound = df_parsed['base_daily_cost'].quantile(0.99)
    df_parsed = df_parsed[(df_parsed['base_daily_cost'] >= lower_bound) & (df_parsed['base_daily_cost'] <= upper_bound)]
    
    # 4. Feature Engineering
    print("Engineering features...")
    
    le_place = LabelEncoder()
    df_parsed['place_code'] = le_place.fit_transform(df_parsed['place'].astype(str))
    
    # Data Augmentation (simulating different group sizes and adding noise)
    augmented_data = []
    for _ in range(5):
        temp_df = df_parsed.copy()
        temp_df['group_size'] = np.random.randint(1, 10, size=len(temp_df))
        
        # Base daily cost is PER PERSON.
        # Group multiplier scales the cost for the whole group.
        # e.g., 2 people = 2^0.85 = 1.8x the per-person cost.
        group_mult = temp_df['group_size'] ** 0.85
        
        # Add some slight random noise so identical itineraries don't all have exact same targets
        noise = np.random.uniform(0.9, 1.1, size=len(temp_df))
        
        # Target Cost is the daily cost for the ENTIRE group
        temp_df['target_cost'] = temp_df['base_daily_cost'] * group_mult * noise
        augmented_data.append(temp_df)
        
    train_df = pd.concat(augmented_data, ignore_index=True)
    
    X = train_df[['place_code', 'month', 'group_size']]
    y = train_df['target_cost']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 5. Train Model
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)
    
    score = model.score(X_test_scaled, y_test)
    print(f"Model R^2 Score: {score:.3f}")
    
    # 6. Save Model
    os.makedirs(MODULE_DIR, exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump({
            'model': model,
            'scaler': scaler,
            'le_place': le_place
        }, f)
        
    print(f"Training Complete! Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_budget_forecaster()
