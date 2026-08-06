import pandas as pd
import numpy as np
import os
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASETS_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'dataset'))
MODULE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'Module'))

MODEL_PATH = os.path.join(MODULE_DIR, 'rf_safety_v2.pkl')

def train_safety_analyzer():
    print("Starting Safety Analyzer V2 Training...")
    
    # 1. Load Data
    crime_path = os.path.join(DATASETS_DIR, 'safety', '01_District_wise_crimes_committed_IPC_2001_2012.csv')
    
    try:
        df_crime = pd.read_csv(crime_path)
    except Exception as e:
        print(f"Error reading crime dataset: {e}")
        return
        
    print(f"Loaded {len(df_crime)} crime records.")
    
    df_crime = df_crime[df_crime['DISTRICT'] != 'TOTAL']
    
    features = ['MURDER', 'RAPE', 'ROBBERY', 'THEFT', 'RIOTS']
    
    df_crime['Danger_Index'] = (
        (df_crime['MURDER'] * 5 +
         df_crime['RAPE'] * 5 +
         df_crime['ROBBERY'] * 3 +
         df_crime['THEFT'] * 1 +
         df_crime['RIOTS'] * 2) / (df_crime['TOTAL IPC CRIMES'] + 1)
    )
    
    df_agg = df_crime.groupby(['STATE/UT', 'DISTRICT'])['Danger_Index'].mean().reset_index()
    
    max_danger = df_agg['Danger_Index'].max()
    min_danger = df_agg['Danger_Index'].min()
    
    df_agg['Safety_Score'] = 100 - (((df_agg['Danger_Index'] - min_danger) / (max_danger - min_danger)) * 100)
    
    le_state = LabelEncoder()
    le_district = LabelEncoder()
    
    df_agg['State_Code'] = le_state.fit_transform(df_agg['STATE/UT'].astype(str))
    df_agg['District_Code'] = le_district.fit_transform(df_agg['DISTRICT'].astype(str))
    
    X = df_agg[['State_Code', 'District_Code']]
    y = df_agg['Safety_Score']
    
    # 3. Train Model
    print("Training Random Forest Regressor...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Model R^2 Score: {score:.3f}")
    
    # 4. Save Model
    os.makedirs(MODULE_DIR, exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump({
            'model': model,
            'le_state': le_state,
            'le_district': le_district
        }, f)
        
    print(f"Training Complete! Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_safety_analyzer()
