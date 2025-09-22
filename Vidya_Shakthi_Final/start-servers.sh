#!/bin/bash
echo "Starting Vidya shakti Final Application..."
echo

echo "[1/2] Starting WebSocket Signaling Server on port 8080..."
cd server
npm install
npm start &
SERVER_PID=$!

echo
echo "[2/2] Starting React Frontend on port 5173..."
cd ..
sleep 3
npm install
npm run dev &
FRONTEND_PID=$!

echo
echo "✅ Both servers are starting..."
echo "📡 WebSocket Server: http://localhost:8080"
echo "🌐 React App: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for both processes
wait
