@echo off
echo Starting Vidya Shakthi Final Application...
echo.

echo [1/2] Starting WebSocket Signaling Server on port 8080...
start "WebSocket Server" cmd /k "cd server && npm install && npm start"

echo.
echo [2/2] Starting React Frontend on port 5173...
timeout /t 3 /nobreak > nul
start "React App" cmd /k "npm install && npm run dev"

echo.
echo ✅ Both servers are starting...
echo 📡 WebSocket Server: http://localhost:8080
echo 🌐 React App: http://localhost:5173
echo.
echo Press any key to exit this window...
pause > nul
