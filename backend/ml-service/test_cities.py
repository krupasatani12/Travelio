import urllib.request, json

res = urllib.request.urlopen('http://localhost:8000/api/cities/Delhi/places/?page=1&limit=5&sort=highest_rated').read().decode('utf-8')
data = json.loads(res)
print(f"City: {data['city']} ({data['state']})")
print(f"Total places: {data['total']}, Pages: {data['total_pages']}")
print()
for p in data['places']:
    print(f"  {p['name']} - {p['type']} | rating {p['rating']} | {p['review_count_lakhs']}L reviews | fee: {p['entrance_fee']}")
    print(f"    image: {p['image'][:70]}...")
    if p['best_time']:
        print(f"    best time: {p['best_time']}")
    print()
