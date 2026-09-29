#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "FoodBridge setup"
echo "Make sure Docker Desktop is running and MongoDB container is available."

if docker ps --format '{{.Names}}' | grep -qx 'foodbridge-mongo'; then
  echo "MongoDB container is already running."
elif docker ps -a --format '{{.Names}}' | grep -qx 'foodbridge-mongo'; then
  docker start foodbridge-mongo
else
  docker run -d --name foodbridge-mongo -p 27017:27017 mongo:7
fi

npm run install-all

echo ""
echo "Setup complete."
echo "Run in Terminal 1: npm run seed"
echo "Run in Terminal 2: npm run backend"
echo "Run in Terminal 3: npm run frontend"
