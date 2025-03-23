#!/bin/bash

# Simple script to run the server without PM2

# Kill any existing node processes
pkill -f "node server.js" || true

# Run the server in background with logging
nohup node server.js > server.log 2>&1 &

# Get the process ID
PID=$!
echo "Server started with PID: $PID"
echo "Log output in server.log"

# Write the PID to a file for later stopping
echo $PID > server.pid

echo "To stop the server, run: kill -15 \$(cat server.pid)"
echo "Or just run: ./stop-server.sh"
