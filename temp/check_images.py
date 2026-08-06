import json

data = json.load(open('temp/image_cache.json'))

total = 0
local = 0
external = 0
ext_samples = []

for key, urls in data.items():
    for u in urls:
        total += 1
        if 'localhost:5000' in u:
            local += 1
        else:
            external += 1
            if len(ext_samples) < 10:
                ext_samples.append(u)

print(f"Total images: {total}")
print(f"Local (localhost:5000/uploads/...): {local} ({round(local/total*100,1)}%)")
print(f"External URLs (still remote): {external} ({round(external/total*100,1)}%)")
print(f"\nSample external URLs:")
for s in ext_samples:
    print(f"  - {s}")
