"""
TravelIO — Gemini Vision Landmark Detector
Identifies Indian landmarks and monuments using Google Gemini Vision API.
"""
import os
import json
from PIL import Image
from django.conf import settings
import google.generativeai as genai
from dotenv import load_dotenv

# Load env variables from backend/server/.env
load_dotenv(os.path.join(settings.BASE_DIR, '..', 'server', '.env'))


class LandmarkDetector:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LandmarkDetector, cls).__new__(cls)
        return cls._instance

    def predict(self, image_file):
        """Uses Google Gemini Vision API to identify landmark, location, confidence, and description."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"error": "GEMINI_API_KEY is not set in backend/server/.env"}

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            img = Image.open(image_file)
            
            prompt = (
                "Identify the primary landmark or monument in this image. "
                "Respond ONLY with valid JSON containing the following exact keys: "
                "'landmark_name' (string), 'location' (string), 'confidence' (number from 0 to 100), "
                "and 'description' (short string). Do not use markdown blocks, just return raw JSON."
            )
            
            response = model.generate_content([prompt, img])
            text = response.text.strip()
            
            # Clean up markdown code blocks if present
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            result = json.loads(text.strip())
            return {
                "landmark_name": result.get("landmark_name", "Unknown Landmark"),
                "location": result.get("location", "Unknown Location"),
                "confidence": float(result.get("confidence", 0)),
                "description": result.get("description", "No description available.")
            }
        except Exception as e:
            print(f"Gemini Vision API Error: {e}")
            return {"error": str(e)}

    def predict_with_gemini(self, image_file):
        return self.predict(image_file)
