import os
import pandas as pd
import numpy as np
import pickle

class BudgetForecasterV2:
    def __init__(self, model_dir=None):
        if model_dir is None:
            model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Module'))
            
        self.model_path = os.path.join(model_dir, 'poly_budget_v2.pkl')
        self.model_data = None

    def load(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Budget V2 model not found at {self.model_path}")
            
        with open(self.model_path, 'rb') as f:
            self.model_data = pickle.load(f)

    def predict(self, destination, duration_days=5, month=1, group_size=2):
        if self.model_data is None:
            self.load()
            
        model = self.model_data['model']
        scaler = self.model_data['scaler']
        le_place = self.model_data['le_place']
        
        # Try to encode the place with case-insensitive and fuzzy matching
        import difflib
        dest_lower = destination.strip().lower()
        classes_lower = [str(c).lower() for c in le_place.classes_]
        
        matches = difflib.get_close_matches(dest_lower, classes_lower, n=1, cutoff=0.8)
        
        try:
            if matches:
                # Find original class corresponding to the matched lowercased string
                match_idx = classes_lower.index(matches[0])
                matched_class = le_place.classes_[match_idx]
                place_code = le_place.transform([matched_class])[0]
                destination = matched_class # Update for factors list
            else:
                # Unseen place, raise ValueError to trigger except block
                raise ValueError
        except ValueError:
            # Unseen place, use median cost place
            place_code = len(le_place.classes_) // 2
        # User input features
        X_input = pd.DataFrame({
            'place_code': [place_code],
            'month': [month],
            'group_size': [group_size]
        })
        
        X_scaled = scaler.transform(X_input)
        daily_cost = model.predict(X_scaled)[0]
        
        total_cost = daily_cost * duration_days
        
        # Add basic noise for factors
        factors = [
            f"Seasonal pricing multiplier for Month {month}",
            f"Accommodation base rate in {destination}",
            f"Group size factor for {group_size} travelers"
        ]
        
        return {
            'predicted_cost_per_day': round(daily_cost, 0),
            'total_estimated_cost': round(total_cost, 0),
            'currency': 'INR',
            'factors': factors
        }

def predict_budget(destination, duration_days=5, month=1, group_size=2):
    forecaster = BudgetForecasterV2()
    return forecaster.predict(destination, duration_days, month, group_size)
