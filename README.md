<p align="center">
  <img src="https://img.icons8.com/3d-fluency/94/airplane-take-off.png" width="80" alt="TravelIO Logo"/>
</p>

<h1 align="center">✈️ Travel.IO</h1>

<p align="center">
  <strong>AI-Powered Smart Travel Companion — Plan, Explore, and Travel Smarter</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/Django-4.2-092E20?logo=django&logoColor=white" alt="Django"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white" alt="Socket.IO"/>
  <img src="https://img.shields.io/badge/TensorFlow-2.20-FF6F00?logo=tensorflow&logoColor=white" alt="TensorFlow"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome"/>
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status"/>
</p>

---

## 📋 Table of Contents

- [🌟 About](#about)
- [✨ Features](#features)
  - [🗺️ Core Travel Features](#core-travel-features)
  - [🤖 AI & Machine Learning](#ai--machine-learning)
  - [📰 Real-Time Features](#real-time-features)
  - [👤 User Management](#user-management)
  - [🛠️ Admin Dashboard](#admin-dashboard)
  - [📓 Travel Journal](#travel-journal)
  - [🎨 UI/UX](#uiux)
- [🛠️ Tech Stack](#tech-stack)
- [🏗️ Architecture](#architecture)
- [📸 Screenshots](#screenshots)
- [🚀 Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [📁 Project Structure](#project-structure)
- [📡 API Endpoints](#api-endpoints)
- [🧠 ML Models & AI Services](#ml-models--ai-services)

---

<a id="about"></a>

## 🌟 About

**Travel.IO** is a full-stack, AI-powered travel planning platform that combines machine learning, real-time data, and beautiful 3D interfaces to create a premium travel experience. From intelligent budget forecasting and safety scoring to landmark detection via image recognition and personalized AI chatbot assistance — Travel.IO is your all-in-one smart travel companion.

> Built as a comprehensive project showcasing **React 19**, **Node.js/Express**, **Django REST Framework**, **MongoDB Atlas**, **TensorFlow**, **Socket.IO**, **Mistral AI**, **Google Gemini**, and **Three.js**.

---



<a id="features"></a>

## ✨ Features

<a id="core-travel-features"></a>

### 🗺️ Core Travel Features
| Feature | Description |
|:--------|:------------|
| **🏙️ City Explorer** | Browse 50+ Indian cities with curated places, seasonal guides, and nearby attractions |
| **📍 Place Discovery** | Detailed pages for tourist attractions with ratings, descriptions, images, and visitor info |
| **🔍 Smart Search** | Full-text + semantic (AI-powered) search across all cities and places |
| **❤️ Favorites** | Save and manage your favorite destinations with one click |
| **🗓️ Trip Planner** | Drag-and-drop multi-day itinerary builder with real-time collaboration |
| **✈️ Flight Search** | Search and compare flights with pricing data |

<a id="ai--machine-learning"></a>

### 🤖 AI & Machine Learning
| Feature | Description |
|:--------|:------------|
| **💬 TravelBot (AI Chatbot)** | Powered by Mistral AI + Gemini — context-aware travel assistant that knows your preferences |
| **💰 Budget Forecaster** | ML model trained on travel datasets to predict trip costs by city, duration, and travel style |
| **🛡️ Safety Scorer** | AI-driven city safety rating system with real-time threat analysis |
| **🏛️ Landmark Detector** | Upload a photo → TensorFlow CNN identifies the landmark with confidence scores |
| **🗺️ Route Optimizer** | Graph-based (NetworkX) optimal route planner between multiple destinations |
| **📊 Smart Recommendations** | Sentence-transformer embeddings for personalized destination suggestions |

<a id="real-time-features"></a>

### 📰 Real-Time Features
| Feature | Description |
|:--------|:------------|
| **📡 WebSocket Updates** | Real-time notifications via Socket.IO |
| **📰 News & Alerts** | Live travel news and safety alerts aggregated from RSS feeds |
| **⏰ Cron Jobs** | Automated daily trip alerts (8 AM IST) and AI credit resets (midnight IST) |
| **📧 Email Notifications** | OTP verification, trip reminders, and itinerary sharing via Gmail SMTP |

<a id="user-management"></a>

### 👤 User Management
| Feature | Description |
|:--------|:------------|
| **🔐 JWT Auth** | Secure registration/login with hashed passwords (bcrypt, salt=12) |
| **✉️ OTP Verification** | Email-based OTP for account verification |
| **💳 Credit System** | 100 daily AI credits with usage tracking per service (auto-reset at midnight) |
| **👥 Role-Based Access** | User and Admin roles with protected routes |

<a id="admin-dashboard"></a>

### 🛠️ Admin Dashboard
| Feature | Description |
|:--------|:------------|
| **📊 Analytics Charts** | City comparison, safety heatmaps, budget trends, vibes donut charts (Plotly.js) |
| **👥 User Management** | View, search, and manage all registered users |
| **📝 API Logging** | Track all API calls with timestamps and response times |
| **📧 Email Logs** | Monitor all system-sent emails |
| **⚙️ System Settings** | Configure platform-wide settings from one panel |

<a id="travel-journal"></a>

### 📓 Travel Journal
| Feature | Description |
|:--------|:------------|
| **📝 Rich Entries** | Write and edit travel stories with photo uploads |
| **📸 Image Gallery** | Attach multiple images to journal entries with drag-and-drop |
| **🔒 Private by Default** | Journals are user-scoped and protected |

<a id="uiux"></a>

### 🎨 UI/UX
| Feature | Description |
|:--------|:------------|
| **🌌 3D Hero** | Interactive Three.js globe on the landing page |
| **🎞️ Splash Loader** | Premium animated splash screen on initial load |
| **✨ Framer Motion** | Smooth page transitions, fade-ups, and micro-animations |
| **📱 Responsive** | Fully responsive design across desktop, tablet, and mobile |
| **🌙 Modern Design** | Glassmorphism, gradients, and curated color palette |

---

<a id="tech-stack"></a>

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| React 19 | UI Framework |
| Vite 8 | Build Tool & Dev Server |
| React Router 7 | Client-side Routing |
| Framer Motion | Animations & Transitions |
| Three.js + React Three Fiber | 3D Graphics |
| React Plotly.js | Data Visualization Charts |
| Socket.IO Client | Real-time Communication |
| Axios | HTTP Client |
| React Icons | Icon Library |
| React Markdown | Markdown Rendering |

### Backend — Node.js API Gateway (Port 5000)
| Technology | Purpose |
|:-----------|:--------|
| Node.js 20 | Runtime |
| Express 4 | REST API Framework |
| MongoDB Atlas + Mongoose | Database & ODM |
| JSON Web Token | Authentication |
| bcrypt.js | Password Hashing |
| Socket.IO | WebSocket Server |
| Nodemailer | Email Service (SMTP) |
| node-cron | Scheduled Tasks |
| Multer | File Upload Handling |
| EJS | Server-side Admin Views |

### Backend — Django ML Microservice (Port 8000)
| Technology | Purpose |
|:-----------|:--------|
| Django 4.2 | Web Framework |
| Django REST Framework | API Layer |
| TensorFlow 2.20 | Deep Learning (Landmark CNN) |
| scikit-learn | ML Models (Budget, Safety) |
| Sentence Transformers | Semantic Search Embeddings |
| NetworkX | Graph-based Route Optimization |
| Pandas / NumPy | Data Processing |
| BeautifulSoup4 | Web Scraping |
| feedparser | RSS News Aggregation |
| Google Generative AI | Gemini Integration |
| DuckDuckGo Search | Web Search Fallback |
| Matplotlib / Seaborn | Chart Generation |

---

<a id="architecture"></a>

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 19)                     │
│              Vite 8 • Three.js • Framer Motion               │
│                    http://localhost:5173                     │
└────────────────────────┬─────────────────────────────────────┘
                         │  Axios + Socket.IO
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               NODE.JS API GATEWAY (Express 4)                │
│          JWT Auth • CORS • Cron • WebSockets • EJS           │
│                    http://localhost:5000                     │
│                                                              │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐    │
│  │ Auth    │ │ Trips    │ │ Budget │ │ Chatbot (Mistral)│    │
│  │ Routes  │ │ Routes   │ │ Routes │ │ + Gemini         │    │
│  └─────────┘ └──────────┘ └────────┘ └──────────────────┘    │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐    │
│  │ Journal │ │ Flights  │ │ Email  │ │ Admin / Analytics│    │
│  │ Routes  │ │ Routes   │ │ Routes │ │ Routes           │    │
│  └─────────┘ └──────────┘ └────────┘ └──────────────────┘    │
└────────────────────────┬─────────────────────────────────────┘
            │            │
            ▼            ▼
┌───────────────┐  ┌───────────────────────────────────────────┐
│  MongoDB      │  │       DJANGO ML MICROSERVICE              │
│  Atlas        │  │    TensorFlow • scikit-learn • NLP        │
│  (Cloud DB)   │  │         http://localhost:8000             │
└───────────────┘  │                                           │
                   │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
                   │  │ Landmark │ │ Budget   │ │ Safety    │  │
                   │  │ Detector │ │ Predict  │ │ Scorer    │  │
                   │  └──────────┘ └──────────┘ └───────────┘  │
                   │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
                   │  │ Route    │ │ Semantic │ │ News      │  │
                   │  │ Optimize │ │ Search   │ │ Scraper   │  │
                   │  └──────────┘ └──────────┘ └───────────┘  │
                   └───────────────────────────────────────────┘
```

---

<a id="screenshots"></a>

## 📸 Screenshots

> [!TIP]
> Replace these placeholder paths with actual screenshots of your deployed app.

| Page | Preview |
|:-----|:--------|
| Home (3D Hero) | *Screenshot of the landing page with 3D globe* |
| City Explorer | *Screenshot of the city browsing page* |
| Trip Planner | *Screenshot of the drag-and-drop itinerary builder* |
| AI Chatbot | *Screenshot of the TravelBot conversation* |
| Admin Dashboard | *Screenshot of the admin analytics panel* |
| Landmark Detector | *Screenshot of the image upload & detection result* |

---

<a id="getting-started"></a>

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|:-----|:--------|:---------|
| **Node.js** | v20 LTS or higher | [nodejs.org](https://nodejs.org/) |
| **Python** | v3.10 or higher | [python.org](https://www.python.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **MongoDB Atlas** | Free Cluster | [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) |

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/krupasatani12/Travelio.git
cd Travelio
```

**2. Install Frontend dependencies**
```bash
cd frontend
npm install
```

**3. Install Backend (Node.js) dependencies**
```bash
cd ../backend/server
npm install
```

**4. Install ML Service (Python) dependencies**
```bash
cd ../ml-service
pip install -r requirements.txt
python manage.py migrate
```

### Environment Variables

Create a `.env` file inside `backend/server/` by copying the example:

```bash
cp backend/server/.env.example backend/server/.env
```

Then open `backend/server/.env` and fill in your credentials:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# MongoDB Atlas — Get yours at https://mongodb.com/atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?appName=TravelIO

# JWT — Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_key_here

# Gmail SMTP — Enable 2FA → App Passwords: https://myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Django ML Service
DJANGO_ML_URL=http://localhost:8000/api

# Mistral AI — Get key at https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here

# Google Gemini — Get key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

> [!IMPORTANT]
> You need **all API keys** for full functionality. The app will run without them, but AI features (chatbot, landmark detection, recommendations) will be disabled.

### Running the App

#### Option 1: One-Click Start (Windows)
Simply double-click **`start_app.bat`** in the root directory. It opens 3 terminal windows automatically.

#### Option 2: Manual Start (3 terminals)

**Terminal 1 — Django ML Service (Port 8000)**
```bash
cd backend/ml-service
python manage.py runserver 8000
```

**Terminal 2 — Node.js API Gateway (Port 5000)**
```bash
cd backend/server
npm run dev
```

**Terminal 3 — React Frontend (Port 5173)**
```bash
cd frontend
npm run dev
```

#### ✅ Verify Everything is Running

| Service | URL | Expected Response |
|:--------|:----|:------------------|
| Frontend | [http://localhost:5173](http://localhost:5173) | React App loads |
| Node API | [http://localhost:5000/api/health](http://localhost:5000/api/health) | `{ "status": "ok" }` |
| Django ML | [http://localhost:8000/api/health/](http://localhost:8000/api/health/) | `{ "status": "healthy" }` |

---

<a id="project-structure"></a>

## 📁 Project Structure

```
Travel.IO/
├── frontend/                     # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/               # Three.js 3D components (Hero globe)
│   │   │   ├── admin/            # Admin dashboard components
│   │   │   ├── chat/             # TravelBot chat widget
│   │   │   ├── common/           # Shared UI (SplashLoader, AuthGate, SpinBadge)
│   │   │   ├── dashboard/        # User dashboard widgets
│   │   │   ├── layout/           # Navbar, Footer
│   │   │   ├── place/            # Place cards and details
│   │   │   ├── trip/             # Trip planner components
│   │   │   └── ui/               # Reusable UI primitives
│   │   ├── context/              # React Context (Auth, Theme)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Route-level page components
│   │   │   ├── Home.jsx          # Landing page with 3D hero
│   │   │   ├── Dashboard.jsx     # User dashboard
│   │   │   ├── Places.jsx        # City/Place explorer
│   │   │   ├── CityPage.jsx      # Individual city detail
│   │   │   ├── TripPlanner.jsx   # Multi-day trip builder
│   │   │   ├── BudgetForecaster  # ML budget prediction UI
│   │   │   ├── SafetyChecker     # AI safety scoring UI
│   │   │   ├── LandmarkDetector  # Image upload + CNN detection
│   │   │   ├── RoutePlanner      # Graph route optimizer UI
│   │   │   ├── ChatbotPage       # Full-page AI chatbot
│   │   │   ├── Journal.jsx       # Travel journal CRUD
│   │   │   ├── NewsAlerts.jsx    # Live travel news
│   │   │   ├── AdminDashboard    # Admin panel with charts
│   │   │   └── SearchResults     # Search results page
│   │   ├── utils/                # Helper functions
│   │   ├── App.jsx               # Root component with routes
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── server/                   # Node.js/Express API Gateway
│   │   ├── config/
│   │   │   └── db.js             # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT authentication guard
│   │   │   ├── creditMiddleware  # AI credit deduction system
│   │   │   ├── apiLogger.js      # Request logging
│   │   │   └── upload.js         # Multer file upload config
│   │   ├── models/
│   │   │   ├── User.js           # User schema (credits, prefs, OTP)
│   │   │   ├── Trip.js           # Trip itinerary schema
│   │   │   ├── Journal.js        # Travel journal entries
│   │   │   ├── Flight.js         # Flight data schema
│   │   │   ├── City.js           # City info schema
│   │   │   ├── Place.js          # Tourist place schema
│   │   │   └── ...               # ApiLog, EmailLog, SystemSettings
│   │   ├── routes/               # 15 route modules
│   │   ├── services/
│   │   │   ├── mistralService    # Mistral AI chatbot integration
│   │   │   ├── emailService      # Nodemailer SMTP service
│   │   │   └── mlProxy.js        # Proxy to Django ML service
│   │   ├── views/                # EJS admin templates
│   │   ├── .env.example          # Environment variable template
│   │   ├── server.js             # Express app entry point
│   │   └── package.json
│   │
│   ├── ml-service/               # Django ML Microservice
│   │   ├── api/
│   │   │   ├── views.py          # REST API views (30+ endpoints)
│   │   │   ├── urls.py           # URL routing
│   │   │   ├── routing_engine    # NetworkX route optimizer
│   │   │   └── charts.py         # Plotly chart generators
│   │   ├── ml/
│   │   │   ├── budget_forecaster # Trip cost prediction model
│   │   │   ├── safety_scorer     # City safety ML model
│   │   │   ├── landmark_detector # TensorFlow CNN classifier
│   │   │   ├── recommender       # Embedding-based recommendations
│   │   │   ├── city_index        # Full-text search index
│   │   │   ├── embedding_index   # Semantic search (transformers)
│   │   │   ├── seasonal_data     # Best-time-to-visit data
│   │   │   └── models/           # Saved ML model weights
│   │   ├── training/             # Model training scripts
│   │   ├── data/                 # Cleaned datasets
│   │   ├── scraper/              # Web scrapers for data
│   │   ├── travelio/             # Django settings
│   │   ├── requirements.txt
│   │   └── manage.py
│   │
│   └── dataset/                  # Raw training datasets
│
├── start_app.bat                 # One-click Windows launcher
├── .gitignore
└── README.md                     # ← You are here
```

---

<a id="api-endpoints"></a>

## 📡 API Endpoints

### Node.js API Gateway (`localhost:5000`)

| Method | Endpoint | Description | Auth |
|:-------|:---------|:------------|:-----|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login + JWT token | ❌ |
| `POST` | `/api/auth/verify-otp` | Verify email OTP | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ |
| `GET` | `/api/trips` | Get user's trips | ✅ |
| `POST` | `/api/trips` | Create new trip | ✅ |
| `PUT` | `/api/trips/:id` | Update trip | ✅ |
| `DELETE` | `/api/trips/:id` | Delete trip | ✅ |
| `GET` | `/api/budget/predict` | Predict trip budget | ✅ |
| `GET` | `/api/safety/:city` | Get city safety score | ✅ |
| `POST` | `/api/landmark/predict` | Detect landmark from image | ✅ |
| `POST` | `/api/chatbot/message` | Chat with TravelBot | ✅ (3 credits) |
| `GET` | `/api/journals` | Get user journals | ✅ |
| `POST` | `/api/journals` | Create journal entry | ✅ |
| `GET` | `/api/news/alerts` | Get travel news | ❌ |
| `POST` | `/api/route` | Optimize route | ✅ |
| `GET` | `/api/flights` | Search flights | ✅ |
| `GET` | `/api/favorites` | Get user favorites | ✅ |
| `POST` | `/api/favorites` | Toggle favorite | ✅ |
| `GET` | `/api/locations` | Get all locations | ❌ |
| `GET` | `/api/analytics` | Admin analytics data | ✅ (Admin) |
| `GET` | `/api/admin/*` | Admin management routes | ✅ (Admin) |
| `POST` | `/api/email/send` | Send email notification | ✅ |
| `GET` | `/api/health` | Health check | ❌ |

### Django ML Service (`localhost:8000`)

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/health/` | ML service health check |
| `GET` | `/api/all-places/` | Get all indexed places |
| `GET` | `/api/all-cities/` | Get all indexed cities |
| `GET` | `/api/search/?q=` | Full-text search |
| `GET` | `/api/search/semantic/?q=` | AI-powered semantic search |
| `GET` | `/api/recommend/?q=` | Personalized recommendations |
| `POST` | `/api/budget/predict/` | ML budget prediction |
| `POST` | `/api/budget/package-predict/` | Package budget prediction |
| `GET` | `/api/safety/<city>/` | City safety score |
| `POST` | `/api/landmark/predict/` | CNN landmark detection |
| `GET` | `/api/cities/` | List all cities |
| `GET` | `/api/cities/<name>/places/` | City places |
| `GET` | `/api/cities/<slug>/detail/` | City detail |
| `GET` | `/api/cities/<slug>/nearby/` | Nearby cities |
| `POST` | `/api/route/` | Route optimization |
| `GET` | `/api/seasonal/` | Seasonal travel data |
| `GET` | `/api/news/alerts/` | RSS news aggregation |
| `GET` | `/api/charts/*` | Analytics chart data |

---

<a id="ml-models--ai-services"></a>

## 🧠 ML Models & AI Services

| Model | Algorithm | Purpose | Training Data |
|:------|:----------|:--------|:--------------|
| **Budget Forecaster** | scikit-learn (Regression) | Predicts trip cost based on city, duration, travel style, group size | Historical travel cost datasets |
| **Safety Scorer** | scikit-learn (Classification) | Rates city safety on multiple parameters | Crime/safety index datasets |
| **Landmark Detector** | TensorFlow CNN | Identifies landmarks from uploaded photos | Image dataset of Indian landmarks |
| **Semantic Search** | Sentence Transformers | Natural language destination search | City/place descriptions |
| **Recommender** | Embedding Similarity | Suggests destinations based on preferences | User behavior + place embeddings |
| **Route Optimizer** | NetworkX (Dijkstra/A*) | Finds optimal multi-stop travel routes | City connectivity graph |
| **TravelBot** | Mistral AI + Gemini | Context-aware travel chatbot | Dynamic (API-based) |



---

<p align="center">
  Made with 💡 and ☕ by <strong>Project Team</strong>
</p>

<p align="center">
  <strong>⭐ Star this repo if you found it useful!</strong>
</p>
