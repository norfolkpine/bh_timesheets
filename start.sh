#!/bin/bash

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting backend server..."
cd backend
source venv/Scripts/activate
python manage.py runserver &
BACKEND_PID=$!

# Start frontend server
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 