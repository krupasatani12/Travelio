import urllib.request
import json
import time
import urllib.parse
import os

BASE_URL = 'http://localhost:8000/api'
PROGRESS_FILE = 'scraper_progress.json'

def fetch_json(url):
    max_retries = 5
    base_delay = 2
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as response:
                return json.loads(response.read().decode())
        except Exception as e:
            print(f"Error fetching {url} (Attempt {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"Waiting {delay} seconds before retrying...")
                time.sleep(delay)
            else:
                print(f"Failed after {max_retries} attempts.")
                return None

def save_progress(city_page, city_index):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump({'city_page': city_page, 'city_index': city_index}, f)

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {'city_page': 1, 'city_index': 0}

def main():
    print("Starting full cache warming with Resume and Exponential Backoff...")
    
    progress = load_progress()
    start_city_page = progress.get('city_page', 1)
    start_city_index = progress.get('city_index', 0)
    
    if start_city_page > 1 or start_city_index > 0:
        print(f"Resuming from City Page {start_city_page}, City Index {start_city_index}...")
    
    first_page = fetch_json(f"{BASE_URL}/cities/?page=1")
    if not first_page:
        print("Failed to get initial cities page.")
        return
        
    total_city_pages = first_page.get('total_pages', 1)
    print(f"Total city pages to process: {total_city_pages}")
    
    for city_page in range(start_city_page, total_city_pages + 1):
        print(f"\n--- Processing Cities Page {city_page}/{total_city_pages} ---")
        cities_data = fetch_json(f"{BASE_URL}/cities/?page={city_page}")
        if not cities_data:
            continue
            
        cities = cities_data.get('cities', [])
        time.sleep(2)
        
        # Determine starting index for this page
        current_start_index = start_city_index if city_page == start_city_page else 0
        
        for i in range(current_start_index, len(cities)):
            city = cities[i]
            city_name = city['city']
            city_slug = city_name.strip().lower().replace(' ', '-')
            
            print(f"  -> Fetching places for {city_name} (Page {city_page}, Index {i})...")
            first_places_page = fetch_json(f"{BASE_URL}/cities/{urllib.parse.quote(city_slug)}/places/?page=1")
            
            if not first_places_page:
                time.sleep(1)
                continue
                
            total_places_pages = first_places_page.get('total_pages', 1)
            time.sleep(1.5)
            
            for place_page in range(2, total_places_pages + 1):
                fetch_json(f"{BASE_URL}/cities/{urllib.parse.quote(city_slug)}/places/?page={place_page}")
                time.sleep(1.5)
                
            # Save progress after successfully processing all places for a city
            save_progress(city_page, i + 1)
            
    print("\nFinished caching all cities and places!")
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)

if __name__ == '__main__':
    main()
