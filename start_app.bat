@echo off
echo Starting Travel.IO Development Servers...

:: Start the Django ML Service
echo Starting Django ML Service (Port 8000)...
start cmd /k "cd backend\ml-service && python manage.py runserver 8000"

:: Start the Node API Gateway
echo Starting Node API Gateway (Port 5000)...
start cmd /k "cd backend\server && npm run dev"

:: Start the React Frontend
echo Starting React Frontend (Port 5173)...
start cmd /k "cd frontend && npm run dev"

echo All servers are starting up in separate windows!
echo You can now open http://localhost:5173 in your browser.
