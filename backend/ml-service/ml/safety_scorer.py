import os
import pandas as pd
import numpy as np
import pickle

class SafetyScorerV2:
    def __init__(self, model_dir=None):
        if model_dir is None:
            model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Module'))
            
        self.model_path = os.path.join(model_dir, 'rf_safety_v2.pkl')
        self.model_data = None

    def load(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Safety V2 model not found at {self.model_path}")
            
        with open(self.model_path, 'rb') as f:
            self.model_data = pickle.load(f)

    def get_score(self, city):
        if self.model_data is None:
            self.load()
            
        model = self.model_data['model']
        le_state = self.model_data['le_state']
        le_district = self.model_data['le_district']
        
        # Try to encode district (city) with fuzzy matching
        import difflib
        city_lower = str(city).strip().lower()
        classes_lower = [str(c).lower() for c in le_district.classes_]
        
        matches = difflib.get_close_matches(city_lower, classes_lower, n=1, cutoff=0.7)
        
        try:
            if matches:
                match_idx = classes_lower.index(matches[0])
                matched_class = le_district.classes_[match_idx]
                district_code = le_district.transform([matched_class])[0]
                # Hard to guess the state code just from city name here without the reverse mapping,
                # For simplicity, we just use the mean state code if we don't map it explicitly
                state_code = len(le_state.classes_) // 2
            else:
                raise ValueError
        except ValueError:
            # If city not found, return generic
            district_code = len(le_district.classes_) // 2
            state_code = len(le_state.classes_) // 2
            
        X_input = pd.DataFrame({
            'State_Code': [state_code],
            'District_Code': [district_code]
        })
        
        score = model.predict(X_input)[0]
        
        # Categorize
        if score > 80:
            category = "High Safety"
        elif score > 60:
            category = "Moderate Safety"
        else:
            category = "Exercise Caution"
            
        tips = [
            "Always use verified transport apps",
            "Keep emergency numbers accessible",
            "Stay aware of your belongings in crowded areas"
        ]
        if score < 60:
            tips.append("Avoid traveling alone late at night")
            
        return {
            'safety_score': round(score, 1),
            'category': category,
            'tips': tips
        }

def get_safety_score(city):
    scorer = SafetyScorerV2()
    return scorer.get_score(city)
