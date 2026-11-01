#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v docker >/dev/null 2>&1; then echo "Docker Desktop is required. Install/start Docker Desktop, then rerun this script."; exit 1; fi
if ! docker info >/dev/null 2>&1; then echo "Start Docker Desktop and wait until it is running, then rerun this script."; exit 1; fi
if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
if grep -q 'REPLACE_WITH' backend/.env; then
  echo "Edit backend/.env first: set ADMIN_EMAIL, ADMIN_PASSWORD (12+ chars), and JWT_SECRET (openssl rand -hex 32)."
  echo "Then run: npm run setup:deps"
  exit 0
fi
docker compose up -d mongo
npm install --prefix backend
npm install --prefix frontend
echo "Setup dependencies complete. Seed users/data in Terminal 2, then run backend and frontend in separate terminals."
