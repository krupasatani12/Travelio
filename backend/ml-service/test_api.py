import urllib.request
import json

try:
    print("Fetching compare route...")
    url = "http://127.0.0.1:8000/api/route/?source=Delhi&destination=Mumbai&optimize=price&mode=compare"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as response:
        data = response.read()
        print(json.loads(data.decode('utf-8')))
except Exception as e:
    print("Error:", e)
