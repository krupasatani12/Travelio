import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score, mean_absolute_error
import joblib
import os
import re

print("Loading dataset...")
df = pd.read_csv('../../dataset/vacation-price-prediction/Train.csv')

print(f"Initial rows: {len(df)}")

# Extract trip nights from Itinerary (e.g. '2N Udaipur . 1N Chittorgarh' -> 3)
def extract_nights(itinerary):
    if pd.isna(itinerary):
        return 0
    # Find all numbers followed by 'N'
    matches = re.findall(r'(\d+)N', str(itinerary))
    return sum(int(m) for m in matches)

df['trip_nights'] = df['Itinerary'].apply(extract_nights)

# Extract average hotel rating (e.g. 'Hotel A:4.5|Hotel B:3' -> 3.75)
def extract_avg_rating(hotel_details):
    if pd.isna(hotel_details) or hotel_details == 'Not Available':
        return 3.0 # Default middle rating
    ratings = re.findall(r':(\d+\.?\d*)', str(hotel_details))
    if not ratings:
        return 3.0
    ratings = [float(r) for r in ratings]
    return sum(ratings) / len(ratings)

df['avg_hotel_rating'] = df['Hotel Details'].apply(extract_avg_rating)

# Count sightseeing stops
def count_sightseeing(sightseeing):
    if pd.isna(sightseeing) or sightseeing == 'Not Available':
        return 0
    return len(str(sightseeing).split('|'))

df['sightseeing_stops'] = df['Sightseeing Places Covered'].apply(count_sightseeing)

# Fill missing flight stops with 0
df['Flight Stops'] = df['Flight Stops'].fillna(0)

# Fill Meals with average or 0 if missing
df['Meals'] = df['Meals'].fillna(0).astype(int)

# Categorical Encodings
le_package = LabelEncoder()
le_start = LabelEncoder()
le_airline = LabelEncoder()

df['Package Type'] = df['Package Type'].fillna('Unknown')
df['Start City'] = df['Start City'].fillna('Unknown')
df['Airline'] = df['Airline'].fillna('Unknown')

df['package_type_encoded'] = le_package.fit_transform(df['Package Type'])
df['start_city_encoded'] = le_start.fit_transform(df['Start City'])
df['airline_encoded'] = le_airline.fit_transform(df['Airline'])

# Features and Target
features = [
    'trip_nights', 'avg_hotel_rating', 'sightseeing_stops', 
    'Flight Stops', 'Meals', 
    'package_type_encoded', 'start_city_encoded', 'airline_encoded'
]

X = df[features]
y = df['Per Person Price']

print("Training model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"R2 Score: {r2_score(y_test, y_pred):.4f}")
print(f"MAE: {mean_absolute_error(y_test, y_pred):.2f}")

# Save the model and encoders
os.makedirs('../../Module', exist_ok=True)
joblib.dump(model, '../../Module/rf_package_budget.pkl')
joblib.dump({
    'le_package': le_package,
    'le_start': le_start,
    'le_airline': le_airline
}, '../../Module/package_budget_encoders.pkl')

print("Model and encoders saved to Module directory!")
