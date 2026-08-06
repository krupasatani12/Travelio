import os
import joblib
import numpy as np

# Load models safely
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULE_DIR = os.path.join(os.path.dirname(BASE_DIR), 'Module')

MODEL_PATH = os.path.join(MODULE_DIR, 'rf_package_budget.pkl')
ENCODERS_PATH = os.path.join(MODULE_DIR, 'package_budget_encoders.pkl')

rf_model = None
encoders = None

try:
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        rf_model = joblib.load(MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        print("✅ Package Budget model loaded successfully!")
except Exception as e:
    print(f"⚠️ Failed to load Package Budget model: {e}")

class PackageBudgetForecaster:
    @staticmethod
    def predict(package_type, nights, flight_stops, meals, start_city, airline='Not Available', avg_hotel_rating=3.0, sightseeing_stops=0):
        if not rf_model or not encoders:
            raise Exception("Package Budget model not loaded.")
        
        le_package = encoders['le_package']
        le_start = encoders['le_start']
        le_airline = encoders['le_airline']

        def safe_encode(encoder, value):
            try:
                return encoder.transform([value])[0]
            except ValueError:
                # Unseen label, return the first one (or transform 'Unknown' if we had it)
                return 0

        pkg_encoded = safe_encode(le_package, package_type)
        start_encoded = safe_encode(le_start, start_city)
        airline_encoded = safe_encode(le_airline, airline)

        # Order matches training: ['trip_nights', 'avg_hotel_rating', 'sightseeing_stops', 'Flight Stops', 'Meals', 'package_type_encoded', 'start_city_encoded', 'airline_encoded']
        features = np.array([[
            int(nights),
            float(avg_hotel_rating),
            int(sightseeing_stops),
            int(flight_stops),
            int(meals),
            pkg_encoded,
            start_encoded,
            airline_encoded
        ]])

        predicted_price = rf_model.predict(features)[0]
        
        return {
            'predicted_cost_per_person': round(predicted_price),
            'currency': 'INR',
            'factors': [
                f'Package Type: {package_type}',
                f'Duration: {nights} nights',
                f'Start City: {start_city}',
                f'Included Meals: {meals}',
                f'Flight Stops: {flight_stops}'
            ]
        }
