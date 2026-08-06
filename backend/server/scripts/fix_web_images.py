import json
import os
import requests
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
CACHE_FILE = os.path.join(BASE_DIR, 'temp', 'image_cache.json')

def main():
    print("Loading image cache...")
    with open(CACHE_FILE, 'r') as f:
        image_cache = json.load(f)
        
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://www.google.com/"
    }
    
    fixed_count = 0
    failed_count = 0
    
    for query, urls in image_cache.items():
        updated = False
        safe_query = "".join([c if c.isalnum() else "_" for c in query.lower()])
        upload_dir = os.path.join(BASE_DIR, 'backend', 'server', 'uploads', 'locations', safe_query)
        
        for i, url in enumerate(urls):
            if url.startswith("http") and "localhost:5000" not in url and "unsplash.com" not in url:
                print(f"Attempting to download: {url}")
                try:
                    resp = requests.get(url, headers=headers, timeout=10)
                    if resp.status_code == 200:
                        if not os.path.exists(upload_dir):
                            os.makedirs(upload_dir)
                            
                        ext = url.split('?')[0].split('.')[-1].lower()
                        if ext not in ['jpg', 'jpeg', 'png', 'webp']:
                            ext = 'jpg'
                            
                        filename = f"fixed_{i+1}.{ext}"
                        filepath = os.path.join(upload_dir, filename)
                        
                        with open(filepath, 'wb') as f:
                            f.write(resp.content)
                            
                        urls[i] = f"http://localhost:5000/uploads/locations/{safe_query}/{filename}"
                        updated = True
                        fixed_count += 1
                        print(f"  -> SUCCESS! Saved as {filename}")
                        time.sleep(0.5) # Be nice to servers
                    else:
                        print(f"  -> FAILED with status {resp.status_code}")
                        failed_count += 1
                except Exception as e:
                    print(f"  -> ERROR: {e}")
                    failed_count += 1
                    
        if updated:
            # Save incrementally just in case it crashes
            with open(CACHE_FILE, 'w') as f:
                json.dump(image_cache, f)
                
    print(f"\nFinished! Successfully downloaded {fixed_count} images locally.")
    print(f"Failed to download {failed_count} images (likely dead links or strong bot protection).")

if __name__ == '__main__':
    main()
