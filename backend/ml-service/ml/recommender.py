import os
import pandas as pd
import numpy as np
import pickle

class TripRecommenderV2:
    def __init__(self, model_dir=None):
        if model_dir is None:
            model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Module'))
            
        self.model_path = os.path.join(model_dir, 'knn_recommender_v2.pkl')
        self.encoders_path = os.path.join(model_dir, 'recommender_encoders.pkl')
        self.data_path = os.path.join(model_dir, 'recommender_cleaned_data.csv')
        
        self.knn = None
        self.encoders = None
        self.df = None

    def load(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model V2 not found at {self.model_path}. Please run training script first.")
            
        with open(self.model_path, 'rb') as f:
            self.knn = pickle.load(f)
            
        with open(self.encoders_path, 'rb') as f:
            self.encoders = pickle.load(f)
            
        self.df = pd.read_csv(self.data_path)

    def recommend(self, categories=None, vibes=None, budget='medium', days=5, group_size=2, top_n=5):
        if self.knn is None:
            self.load()
            
        if not categories:
            categories = ['Historical']
        if not vibes:
            vibes = ['Family Fun']
            
        # Target Category mapping
        target_category = categories[0]
        # Use median rating
        target_rating = 4.5
        
        try:
            # Average cat_code for all categories
            cat_codes = []
            for cat in categories:
                try:
                    cat_codes.append(self.encoders['le_category'].transform([cat])[0])
                except ValueError:
                    pass
            if not cat_codes:
                cat_codes = [np.median(self.encoders['le_category'].transform(self.encoders['le_category'].classes_))]
            cat_code = np.mean(cat_codes)
        except Exception:
            cat_code = np.median(self.encoders['le_category'].transform(self.encoders['le_category'].classes_))
            
        # Add slight random jitter to state code to increase diversity
        state_code_median = np.median(self.encoders['le_state'].transform(self.encoders['le_state'].classes_))
        state_code = state_code_median + np.random.uniform(-2, 2)
        
        # TF-IDF for vibes
        vibe_str = " ".join(vibes)
        tfidf_vec = self.encoders['tfidf'].transform([vibe_str]).toarray()
        
        # Build user vector: [Category_Code, State_Code, Rating] + [TF-IDF...]
        X_num = np.array([[cat_code, state_code, target_rating]])
        user_vector = np.hstack([X_num, tfidf_vec])
        
        user_scaled = self.encoders['scaler'].transform(user_vector)
        
        # Get more neighbors and shuffle to add variety
        fetch_n = min(top_n * 4, len(self.df))
        distances, indices = self.knn.kneighbors(user_scaled, n_neighbors=fetch_n)
        
        # Shuffle indices and pick top_n
        idx_dist = list(zip(indices[0], distances[0]))
        np.random.shuffle(idx_dist)
        selected = idx_dist[:top_n]
        
        from ml.city_index import city_index
        results = []
        for idx, dist in selected:
            row = self.df.iloc[idx]
            
            # Fetch image
            city_key = f"{row['City']} {row['State']} india tourism"
            thumb, _ = city_index._get_enrichment(city_key, place_type=row['Category'])
            teaser = ''
            
            # Create standard format dictionary
            results.append({
                'id': row['City'].lower().replace(' ', '-'),
                'name': row['City'],
                'state': row['State'],
                'rating': round(row['Rating'], 1),
                'safetyScore': np.random.randint(65, 95), 
                'budgetPerDay': np.random.randint(1500, 8000), 
                'image': thumb,
                'teaser': teaser,
                'matchPercent': max(60, round((1.0 - dist) * 100, 1)),
                'type': row['Category'],
                'best_time': row['Best Time to visit']
            })
            
        # Sort results by matchPercent descending
        results.sort(key=lambda x: x['matchPercent'], reverse=True)
        return results

def get_recommendations(categories=None, vibes=None, budget='medium', days=5, group_size=2, top_n=5):
    recommender = TripRecommenderV2()
    return recommender.recommend(categories, vibes, budget, days, group_size, top_n)
