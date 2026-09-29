# FoodBridge — Food Donation Data Analytics Platform

A full-stack FoodBridge application with React/Vite frontend, Node/Express backend, MongoDB database, role-based authentication, donations, deliveries, analytics, AI demo insights, reports, notifications, and password reset.

## Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Lucide
- Backend: Node.js, Express, JWT, bcryptjs
- Database: MongoDB
- Roles: Donor, NGO, Volunteer, Admin

## Run on macOS

### Terminal 1 — MongoDB

```bash
cd ~/Downloads/foodbridge-final
docker start foodbridge-mongo 2>/dev/null || docker run -d --name foodbridge-mongo -p 27017:27017 mongo:7
```

### Terminal 2 — Backend

```bash
cd ~/Downloads/foodbridge-final/backend
npm install
npm run seed
npm run dev
```

Backend: http://localhost:5001
Health: http://localhost:5001/api/health

### Terminal 3 — Frontend

```bash
cd ~/Downloads/foodbridge-final/frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Demo accounts

All demo accounts use:

```text
Password: password123
```

```text
Admin:     admin@foodbridge.app
Donor:     donor@foodbridge.app
NGO:       ngo@foodbridge.app
Volunteer: volunteer@foodbridge.app
```

Select the matching role on the login screen.

## Forgot Password

Use **Forgot password?** on the login screen. Enter an existing account email and a new password. The backend updates the bcrypt password hash in MongoDB.

This is a local/demo password-reset flow. A production deployment should use a verified email/OTP or signed reset token before allowing a password change.

## GitHub

Do not commit `.env` files, node_modules, API keys, or real credentials. Use the included `.env.example` files as templates.
