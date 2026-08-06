import urllib.request

endpoints = ['ml-performance', 'safety-heatmap', 'budget-trends', 'vibes-donut', 'system-health']
for e in endpoints:
    url = f'http://localhost:8000/api/charts/{e}/'
    try:
        req = urllib.request.urlopen(url)
        data = req.read()
        is_png = data.startswith(b'\x89PNG')
        print(f'{e}: {req.status} OK, Size: {len(data)} bytes, isPNG: {is_png}')
    except Exception as ex:
        print(f'{e}: ERROR - {ex}')
