#!/bin/bash

# Simple script to stop the server

if [ -f server.pid ]; then
  PID=$(cat server.pid)
  echo "Stopping server with PID: $PID"
  kill -15 $PID || true
  rm server.pid
  echo "Server stopped"
else
  echo "No server.pid file found"
  # Try to find any node processes running server.js
  PIDS=$(pgrep -f "node server.js")
  if [ -n "$PIDS" ]; then
    echo "Found node processes: $PIDS"
    kill -15 $PIDS
    echo "Server processes stopped"
  else
    echo "No running server processes found"
  fi
fi
