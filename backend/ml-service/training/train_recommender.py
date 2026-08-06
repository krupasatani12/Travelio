import pandas as pd
import numpy as np
import os
import pickle
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'dataset'))
MODULE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'Module'))

# Output files
MODEL_PATH = os.path.join(MODULE_DIR, 'knn_recommender_v2.pkl')
ENCODER_PATH = os.path.join(MODULE_DIR, 'recommender_encoders.pkl')
CLEAN_DATA_PATH = os.path.join(MODULE_DIR, 'recommender_cleaned_data.csv')

def train_recommender():
    print("Starting Destination Recommender V2 Training...")
    
    # 1. Load Data
    expanded_path = os.path.join(DATASET_DIR, 'Expanded_Indian_Travel_Dataset.csv')
    top_places_path = os.path.join(DATASET_DIR, 'destinations', 'Top Indian Places to Visit.csv')
    
    # Load and handle encoding for Top Places
    try:
        df_top = pd.read_csv(top_places_path, encoding='latin1')
    except Exception as e:
        print(f"Error reading Top Places: {e}")
        return

    # Basic cleanup for Top Places
    df_top = df_top[['State', 'City', 'Name', 'Type', 'Google review rating', 'Best Time to visit']].dropna()
    df_top.rename(columns={'Name': 'Destination', 'Type': 'Category', 'Google review rating': 'Rating'}, inplace=True)
    
    print(f"Loaded {len(df_top)} destinations.")
    
    # 2. Feature Engineering
    le_category = LabelEncoder()
    df_top['Category_Code'] = le_category.fit_transform(df_top['Category'].astype(str))
    
    le_state = LabelEncoder()
    df_top['State_Code'] = le_state.fit_transform(df_top['State'].astype(str))
    
    tfidf = TfidfVectorizer(max_features=10)
    tfidf_matrix = tfidf.fit_transform(df_top['Best Time to visit'].astype(str)).toarray()
    
    X_num = df_top[['Category_Code', 'State_Code', 'Rating']].values
    X = np.hstack([X_num, tfidf_matrix])
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 3. Train Model
    print("Training KNN Model...")
    knn = NearestNeighbors(n_neighbors=5, metric='cosine')
    knn.fit(X_scaled)
    
    # 4. Save Models and Encoders
    os.makedirs(MODULE_DIR, exist_ok=True)
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(knn, f)
        
    with open(ENCODER_PATH, 'wb') as f:
        pickle.dump({
            'le_category': le_category,
            'le_state': le_state,
            'tfidf': tfidf,
            'scaler': scaler
        }, f)
        
    df_top.to_csv(CLEAN_DATA_PATH, index=False)
    
    print(f"Training Complete! Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_recommender()
