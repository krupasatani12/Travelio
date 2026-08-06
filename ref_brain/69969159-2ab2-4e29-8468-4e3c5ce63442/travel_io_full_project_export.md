# 🧠 Travel.IO — Full Project Memory Export

> **Purpose**: Paste this entire document as your FIRST message to a new Antigravity instance so it can fully understand what we are building, what has been done, and where to resume.

---

## 🏗️ What We Are Building

**Travel.IO** is a **premium AI-powered travel recommendation platform for India** with three interconnected services:

| Service | Tech | Port | Location |
|---------|------|------|----------|
| **Client** (Frontend) | React + Vite | 5173 | `d:\Travel.IO\client` |
| **Server** (API Gateway) | Node.js + Express + MongoDB | 5000 | `d:\Travel.IO\server` |
| **ML Service** (AI/ML Engine) | Python + Django + Pandas | 8000 | `d:\Travel.IO\ml-service` |

**Key APIs & Services:**
- **Mistral AI** (NOT Gemini) — used for chatbot, trip planning, and semantic search via `server/services/mistralService.js`
- **MongoDB** — primary database for users, locations, journals, trips, flights, favorites
- **DuckDuckGo/Bing Image Scraping** — for downloading location images locally (via `ml-service/ml/image_scraper.py`)
- **Nodemailer** — for sending trip plan emails

**Data Sources (in `temp/` folder):**
- `places.csv` + `Top Indian Places to Visit.csv` — 1,135 places across 241 cities in 37 states
- `flights.csv` — 15,000+ flight records (Airline, Source, Destination, Price, etc.)
- `locations_rows.csv` — semantic search embeddings
- `image_cache.json` — tracks which locations have had images downloaded

---

## 📋 The Master Plan: 8 Phases

This is the EXACT plan agreed upon by the user (originally created in our conversation):

### Phase 1: City Pages & Places Navigation ✅ COMPLETED
- Dedicated URLs for each city (`/places/:citySlug`) and place (`/places/:citySlug/:placeSlug`)
- City hero page with parallax images, city stats, places grid, and nearby cities
- Place detail page with images, ratings, reviews, budget/safety widgets, Google Maps links
- Favorites/Wishlist system (heart icon, "Add to Wishlist" button)
- Chatbot receives city URL as context

**Files Created/Modified:**
- `client/src/pages/CityPage.jsx` + `CityPage.css` [NEW]
- `client/src/pages/PlaceDetailPage.jsx` [NEW]
- `client/src/App.jsx` — new routes added
- `ml-service/api/views.py` — `city_detail`, `city_nearby`, `place_detail`, `places_autocomplete` endpoints
- `ml-service/api/urls.py` — new URL patterns
- `server/services/mlProxy.js` — proxy methods for new endpoints

---

### Phase 2: Navbar Restructure & Smart Travel Tools ✅ COMPLETED
- Navbar changed from `Places, Plan Trip, Budget, Safety, Routes` → `Places, Plan Trip, News, Journals, Routes`
- Budget & Safety moved into "Smart Travel Tools" (accessible within Trip Planner)
- News page enhanced with clickable links to original news sources
- Routes page enhanced with flight/train data + Google Maps direction links ("Route Map Link" concept)

**Files Modified:**
- `client/src/components/layout/Navbar.jsx`
- `client/src/pages/NewsAlerts.jsx`
- `client/src/pages/RoutePlanner.jsx`

---

### Phase 3: Journal System Overhaul ✅ COMPLETED
- Public/Private journal visibility toggle (default: private)
- Photo/video media uploads stored locally on filesystem
- Destination autocomplete (type "go" → shows "Goa", "Gopnath", etc.)
- Social features: comments, likes, saves from other users
- Place-linked journals visible on place detail pages

**Files Modified:**
- `server/models/Journal.js` — added `visibility`, `media[]`, `comments[]`, `savedBy[]`
- `server/routes/journal.routes.js` — added public feed, comments, media upload endpoints
- `client/src/pages/Journal.jsx` — complete overhaul with autocomplete, media upload, public/private toggle

---

### Phase 4: AI-Powered Trip Planner Overhaul ✅ COMPLETED
- Multi-step trip planning flow:
  1. Form (categories, vibes, budget, days, group size, month)
  2. AI city recommendations
  3. City & place selection with checkboxes, day assignment
  4. AI chatbot generates full day-wise itinerary (like the Somnath→Dwarka example below)
  5. Final overview + auto-email with Google Maps route links per day
- "Extended plan" section: AI suggests what to add with more days/budget
- Login gate: form can be filled freely, but "Discover Cities" requires login
- Tool preferences: user can toggle Budget/Safety/Route suggestions ON/OFF in profile

**Key Example (User's vision for trip email):**
```
🌊 2-Day Somnath to Dwarka Trip Plan (Budget: ₹2,000–₹5,000)

Day 1: Somnath → Veraval → Porbandar
Morning (7:00 AM – 10:00 AM): Start with Somnath Temple...
...

Day 2: Porbandar → Dwarka
6:30 AM: Early start to Sudama Setu...
...

Each day has a separate Google Maps route link.
Email includes place cards with images + Google anchor links.
```

**Files Modified:**
- `client/src/pages/TripPlanner.jsx`
- `server/routes/chatbot.routes.js` — `POST /api/chatbot/trip-plan`
- `server/routes/trip.routes.js` — `POST /api/trips/confirm-full`
- `server/services/emailService.js` — `sendTripPlanEmail()`
- `server/services/mistralService.js` — `generateItinerary()` (uses Mistral API)

---

### Phase 5: Credit System ✅ COMPLETED
- 100 credits/day per user, resets at midnight IST
- Chat message: 2-5 credits, Trip planner: 10 credits, Landmark detection: 3 credits
- Credit usage bar on user dashboard ("42/100 credits used today")
- Admin can adjust credit limits per user
- Chat input disabled when credits exhausted

**Files Created/Modified:**
- `server/middleware/creditCheck.js` [NEW]
- `server/models/User.js` — added `credits` and `creditHistory` fields
- `server/routes/chatbot.routes.js` — credit middleware applied
- `client/src/pages/Dashboard.jsx` — credit usage display
- `client/src/pages/ChatbotPage.jsx` — remaining credits in header

---

### Phase 6: Database Expansion 🔄 ~71% DONE (Image Downloading In Progress)
- `ChatHistory.js` model [NEW] — stores chatbot conversation history
- `EmailLog.js` model [NEW] — tracks email delivery status
- `Flight.js` model [NEW] — 15,000+ flight records seeded from CSV
- `/api/flights/search` endpoint — query flights by source/destination
- `Location.js` updated with `images` array for local image storage
- `SplashLoader.jsx` with animated Paper Plane SVG (frames reordered: 61-104 then 0-60)
- **Image scraping script** (`ml-service/ml/image_scraper.py`) downloading images for all 1,376 locations
  - Uses `temp/image_cache.json` for resume capability
  - As of last check: **974/1,376 locations cached (~71%)**
  - Script can be resumed with: `python server/scripts/cache_all_places.py`
  - Requires Django ML service running on port 8000

---

### Phase 7: Admin Dashboard Overhaul ❌ NOT STARTED
- Python Matplotlib/Seaborn chart generation via `ml-service/api/charts.py`:
  1. ML Model Performance (Line Chart)
  2. Destination Safety Distribution (Heatmap)
  3. Budget vs Duration Trends (Scatter Plot)
  4. Top Recommended Vibes/Categories (Donut Chart)
  5. System Health & API Usage (Area Chart)
- LLM Settings panel: Temperature slider, Max Tokens, Top-P
- Online/Offline mode toggle (offline = chatbot off, email off, AI features off)
- Credit management: admin can modify per-user credit limits
- Email delivery logs

**Files to Create/Modify:**
- `ml-service/api/charts.py` [NEW]
- `server/models/SystemSettings.js` [NEW]
- `server/routes/admin.routes.js` — enhanced endpoints
- `client/src/pages/AdminDashboard.jsx` — charts, settings panels

---

### Phase 8: Login Gates & Miscellaneous ❌ NOT STARTED
- `AuthGate.jsx` wrapper component — shows login prompt overlay for protected actions
- Login required for: favorites, save trip, chatbot, trip planner (after form fill), journal creation, journal reactions

---

## 🔧 User Preferences & Rules

1. **"1st listen my answer and wait then I said continue..."** — Always wait for user's explicit "continue" before building.
2. **Mistral API** — NOT Gemini. Already integrated in `server/services/mistralService.js`.
3. **Media storage** — Local filesystem + paths saved in MongoDB.
4. **Admin charts** — Python Matplotlib/Seaborn, served as images to admin panel.
5. **Credit reset** — Midnight IST daily.
6. **Build approach** — One phase at a time, wait for "continue" signal.

---

## 🚀 How to Start All Services

```bash
# Terminal 1: Django ML Service
cd d:\Travel.IO\ml-service
python manage.py runserver 8000

# Terminal 2: Node.js API Gateway
cd d:\Travel.IO\server
npm run dev

# Terminal 3: React Frontend
cd d:\Travel.IO\client
npm run dev

# Resume image downloading (optional, run while Django is up)
cd d:\Travel.IO
python server\scripts\cache_all_places.py
```

---

## 📁 Key File Locations

| Purpose | Path |
|---------|------|
| React App Entry | `client/src/App.jsx` |
| React Pages | `client/src/pages/` |
| React Components | `client/src/components/` |
| Node.js Server Entry | `server/server.js` |
| Express Routes | `server/routes/` |
| Mongoose Models | `server/models/` |
| Mistral AI Service | `server/services/mistralService.js` |
| ML Proxy (Node→Django) | `server/services/mlProxy.js` |
| Email Service | `server/services/emailService.js` |
| Django Views | `ml-service/api/views.py` |
| Django URLs | `ml-service/api/urls.py` |
| City Index (data loader) | `ml-service/ml/city_index.py` |
| Image Scraper | `ml-service/ml/image_scraper.py` |
| Cache Script | `server/scripts/cache_all_places.py` |
| Image Cache JSON | `temp/image_cache.json` |
| Paper Plane SVG | `temp/paper_plane_animation_reordered.svg` |
| Places Data | `temp/places.csv` |
| Flights Data | `temp/flights.csv` |

---

## 🎯 Where to Resume

1. **Finish Phase 6**: The image download script needs to finish (~30% remaining). Run `python server/scripts/cache_all_places.py` while Django is up on port 8000.
2. **Start Phase 7**: Admin Dashboard Overhaul (charts, LLM settings, online/offline mode, credit management).
3. **Then Phase 8**: Login gates and final polish.

---

## 🧠 Brain Files Location (for reference)

All conversation history and artifacts are stored at:
```
C:\Users\KAVYA\.gemini\antigravity-ide\brain\69969159-2ab2-4e29-8468-4e3c5ce63442\
C:\Users\KAVYA\.gemini\antigravity-ide\brain\f683538a-f164-4172-bbbe-157ba20a7abf\
C:\Users\KAVYA\.gemini\antigravity-ide\brain\20de2358-5fcc-48a8-ab9b-da8430ad0c84\
```
