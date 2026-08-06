import os
import json
import time
import requests
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_FILE = BASE_DIR / 'cache' / 'google_places_cache.json'

PLACES_KEY = os.environ.get('GOOGLE_PLACES_KEY')

# Dummy mapping for simulation since we don't want to make thousands of real API calls during development.
# In a real scenario, this would map location names to Google Place IDs and fetch live data.
DUMMY_DATA = {
    'Manali': {'google_rating': 4.5, 'google_review_count': 12500, 'entry_fee': 0, 'price_level': 2},
    'Jaipur': {'google_rating': 4.6, 'google_review_count': 25000, 'entry_fee': 500, 'price_level': 3},
    'Goa': {'google_rating': 4.7, 'google_review_count': 45000, 'entry_fee': 0, 'price_level': 3},
    'Varanasi': {'google_rating': 4.4, 'google_review_count': 18000, 'entry_fee': 0, 'price_level': 1},
    # Default fallback for others
    'default': {'google_rating': 4.3, 'google_review_count': 5000, 'price_level': 2}
}

_memory_cache = None

def load_cache():
    """Load the cache from disk if it exists, or from memory if already loaded."""
    global _memory_cache
    if _memory_cache is not None:
        return _memory_cache
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                _memory_cache = json.load(f)
                return _memory_cache
        except json.JSONDecodeError:
            _memory_cache = {}
            return _memory_cache
    _memory_cache = {}
    return _memory_cache

def save_cache(cache_data):
    """Save the cache to disk."""
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache_data, f, indent=4)

def get_place_data(destination_name):
    """
    Get Google Places data for a destination.
    Uses a dummy mapping for now to simulate the API response.
    """
    cache = load_cache()
    
    if destination_name in cache:
        return cache[destination_name]
    
    # Simulate API fetch
    data = DUMMY_DATA.get(destination_name, DUMMY_DATA['default'].copy())
    
    # Add some randomness to default values to make them look real
    if destination_name not in DUMMY_DATA:
        import random
        data['google_rating'] = round(random.uniform(3.8, 4.9), 1)
        data['google_review_count'] = random.randint(1000, 20000)
    
    # Cache the result
    cache[destination_name] = data
    save_cache(cache)
    
    return data

# Initialize cache file with some defaults if it doesn't exist
if not CACHE_FILE.exists():
    save_cache(DUMMY_DATA)
