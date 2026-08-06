import os
import requests
from pymongo import MongoClient
from ddgs import DDGS
import time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def get_google_images(query, count=5):
    try:
        clean_urls = []
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=count))
            clean_urls = [r['image'] for r in results]
                    
        if not clean_urls:
            return []
            
        clean_urls = list(dict.fromkeys(clean_urls)) # dedupe
        
        while len(clean_urls) < count:
            clean_urls.append(clean_urls[0])
            
        return clean_urls[:count]
    except Exception as e:
        print("Image Scraper Error:", e)
        return []

def main():
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_uri)
    db = client.travelio
    locations = db.locations

    # Base upload directory
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'locations')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    all_locations = list(locations.find({}))
    for loc in all_locations:
        # Check if we need to update images
        # We update if images array is missing, empty, or if heroImage has unsplash default
        needs_update = False
        if not loc.get('images') or len(loc.get('images', [])) == 0:
            needs_update = True
        if loc.get('heroImage') and 'photo-1524492412937' in loc.get('heroImage'):
            needs_update = True
        
        if needs_update:
            print(f"Fetching images for {loc['name']}...")
            query = f"{loc['name']} tourism landmarks high resolution"
            image_urls = get_google_images(query, 5)
            
            if not image_urls:
                print(f"Failed to fetch images for {loc['name']}")
                continue
            
            loc_dir = os.path.join(upload_dir, loc['locationId'])
            if not os.path.exists(loc_dir):
                os.makedirs(loc_dir)
            
            local_paths = []
            for i, url in enumerate(image_urls):
                try:
                    response = requests.get(url, timeout=10)
                    response.raise_for_status()
                    
                    ext = url.split('?')[0].split('.')[-1].lower()
                    if ext not in ['jpg', 'jpeg', 'png', 'webp']:
                        ext = 'jpg'
                        
                    filename = f"img_{i+1}.{ext}"
                    filepath = os.path.join(loc_dir, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(response.content)
                        
                    local_paths.append(f"/uploads/locations/{loc['locationId']}/{filename}")
                except Exception as e:
                    print(f"Failed to download image {i+1} for {loc['name']} from {url}: {e}")
                    
            if local_paths:
                locations.update_one(
                    {'_id': loc['_id']},
                    {'$set': {
                        'heroImage': local_paths[0],
                        'images': local_paths
                    }}
                )
                print(f"Updated {loc['name']} with {len(local_paths)} images.")
            else:
                print(f"No images saved for {loc['name']}.")
                
            time.sleep(2) # rate limit

if __name__ == "__main__":
    main()
