#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "FoodBridge setup"
echo "1) Start MongoDB in another terminal if using local MongoDB, or Docker Desktop."
echo "2) Installing backend dependencies..."
npm --prefix backend install
echo "3) Installing frontend dependencies..."
npm --prefix frontend install
echo "4) Copying backend environment file..."
[ -f backend/.env ] || cp backend/.env.example backend/.env
echo "Setup complete."
echo "Terminal 1: npm run seed"
echo "Terminal 2: npm run backend"
echo "Terminal 3: npm run frontend"
