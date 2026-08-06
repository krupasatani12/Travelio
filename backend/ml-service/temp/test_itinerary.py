import requests
import json

def test_generate():
    print("Testing generate...")
    url = "http://localhost:5000/api/trips/generate-itinerary"
    data = {
        "city": "Jaipur",
        "days": 2,
        "budget": "medium",
        "vibes": ["Historical"]
    }
    try:
        r = requests.post(url, json=data)
        print("Status:", r.status_code)
        if r.status_code == 200:
            print("Response length:", len(r.text))
            res_json = r.json()
            if "itinerary" in res_json:
                print("Generated days:", len(res_json["itinerary"]))
                print("First day theme:", res_json["itinerary"][0]["theme"])
                return res_json
            else:
                print("Invalid response format:", r.text)
        else:
            print("Error:", r.text)
    except Exception as e:
        print("Exception:", e)
    return None

def test_extend(itinerary):
    print("\nTesting extend...")
    url = "http://localhost:5000/api/trips/extend-itinerary"
    data = {
        "city": "Jaipur",
        "existingItinerary": itinerary,
        "extraDays": 1,
        "extraBudget": 2000,
        "vibes": ["Historical"]
    }
    try:
        r = requests.post(url, json=data)
        print("Status:", r.status_code)
        if r.status_code == 200:
            print("Response length:", len(r.text))
            res_json = r.json()
            if "extended_days" in res_json:
                print("Extended days generated:", len(res_json["extended_days"]))
            else:
                print("Invalid format:", r.text)
        else:
            print("Error:", r.text)
    except Exception as e:
        print("Exception:", e)

if __name__ == '__main__':
    itin = test_generate()
    if itin:
        test_extend(itin)
