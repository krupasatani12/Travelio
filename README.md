# Travel.IO - Developer Setup Guide

Welcome to the Travel.IO project! Follow these steps to get the app running on your local machine exactly how it was built.

## 1. Prerequisites
Before you start, make sure you have installed:
- **Python (v3.13)** (or any version 3.10+)
- **Node.js (v20 LTS)**

## 2. Environment Variables (.env)
You need to create a `.env` file inside the `backend/server/` directory and fill it with your own credentials:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
DJANGO_ML_URL=http://127.0.0.1:8000/api
```

## 3. Installation
You need to install the dependencies for all three environments. Open a terminal in the root folder and run:

**Frontend (React):**
```bash
cd frontend
npm install
```

**Backend (Node API Gateway):**
```bash
cd backend/server
npm install
```

**ML-Service (Django & AI):**
```bash
cd backend/ml-service
pip install -r requirements.txt
python manage.py migrate
```

## 4. Running the App
You can either open 3 separate terminals to start the servers manually, OR you can simply double-click the **`start_app.bat`** file in the root directory!

**Manual Commands:**
1. `cd frontend && npm run dev`
2. `cd backend/server && npm run dev`
3. `cd backend/ml-service && python manage.py runserver 8000`

Once started, open your browser and go to: **http://localhost:5173**
