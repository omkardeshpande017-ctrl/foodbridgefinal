# FoodBridge — deployment & test report

Generated: 2026-11-01 (Asia/Calcutta) · Source: `~/Downloads/foodbridge-final`

## 1. Summary

The real FoodBridge project from Downloads was inspected, hardened, tested against a live
MongoDB, and pushed to `omkardeshpande017-ctrl/foodbridgefinal` (branch `main`).
A production Vercel deployment of the exact repository contents was built and uploaded
successfully, but **every request to it is blocked by Vercel's edge** (`403 Forbidden`,
`x-vercel-mitigated: deny`) because anonymous "temporary" deployments cannot be served to the
public. A permanent, public production URL requires Vercel account access, and a persistent
production MongoDB requires a MongoDB Atlas (or equivalent) connection string. Both are
account-bound and were requested; nothing was faked in their place.

## 2. Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind 3, React Router 7, Recharts, lucide-react |
| Backend | Node 22, Express 4, Mongoose 8, JWT (2 h), bcrypt (cost 12), CORS, morgan |
| Database | MongoDB (local `mongod` 9.0.2 during verification; Atlas for production) |
| Deploy | `vercel.json` (static Vite build + `/api` serverless function), Docker Compose, Dockerfiles |

## 3. Changes implemented

**Backend**
- `server.js`: strict `JWT_SECRET` validation (no default, no demo fallback), CORS allow-list with
  Vercel preview support, auth rate limiting (40 attempts / 15 min per IP+email), JSON 404/500
  handlers, `export default app` for serverless plus local `listen`, DB probe in `/api/health`,
  per-invocation MongoDB connect on serverless registered **before** the routers.
- `config/db.js`: cached Mongoose connection, `serverSelectionTimeoutMS: 8000`.
- `routes/deliveries.js`: rebuilt with ownership checks — NGO creates and assigns a volunteer,
  volunteer advances `assigned → picked_up → in_transit → delivered`, donation status follows.
- `routes/donations.js`: an NGO can release its own accepted donation; volunteers can filter
  `?mine=true`.
- `routes/analytics.js`: the 7-day trend is computed from real donations (fixed arrays removed).
- `routes/ai.js`: insights and forecast derived from live collections, flagged `method: 'rule-based'`
  (the previous hard-coded "demo AI" payload is gone).
- `models/Delivery.js`: `ngoId` + indexes; `seed.js` unchanged (idempotent admin provisioning).

**Frontend**
- `pages/Volunteer.jsx`: real assigned tasks from the API (demo tasks removed), loading/empty/error
  states, per-step progress with server-side validation surfaced.
- `pages/Requests.jsx`, `pages/Distribution.jsx`: real accepted-donation data instead of hard-coded
  tables, with live status counters.
- `components/Navbar.jsx`: Login link for guests, Logout for sessions, working mobile menu.

**Repository / deployment**
- `vercel.json`, `api/index.js` (serverless entry), `.vercelignore`.
- `backend/Dockerfile`, `frontend/Dockerfile` + `nginx.conf`, `docker-compose.yml` (mongo + api with
  a persistent named volume and healthchecks).
- `backend/.env.example`, `frontend/.env.example`, rewritten `README.md`, `TERMINAL_COMMANDS.md`.
- Removed the in-memory demo store and every demo credential (`password123`, `*@foodbridge.app`).

## 4. Test results — local, against real MongoDB

`ADMIN_EMAIL=… ADMIN_PASSWORD=… npm test` → **35 passed, 0 failed**.

| Group | Checks | Result |
|---|---|---|
| Health | endpoint + real DB state | PASS |
| Registration | donor / NGO / volunteer created, admin self-registration rejected (400) | PASS (4) |
| Login | wrong password 401, correct password 200, role from DB, protected route 401 | PASS (4) |
| Donations | donor creates, NGO cannot create (403), invalid input 400, donor list, donor cannot accept (403), NGO accepts, NGO recorded, double accept 409 | PASS (8) |
| Pickup & delivery | NGO assigns volunteer, volunteer sees task, donor cannot progress (403), picked_up → in_transit → delivered, donation follows, notifications created | PASS (8) |
| Analytics | scoped summary, 7-day trend, donation counted, insights data-derived, forecast | PASS (5) |
| Profile & users | profile update persists, non-admin cannot list users (403) | PASS (2) |
| Admin | admin login, user list, reports | PASS (3) |
| Build | `npm run build` from a clean clone | PASS |
| Serverless entry | `VERCEL=1` → `/api/health` (database: connected), login, `/api/analytics/overview` | PASS |

Browser verification (local, http://localhost:5173): landing page renders
("Turn Surplus Food Into Meaningful Impact"), login as the admin reaches `/dashboard`,
all API calls 200, no console or network errors, no error overlay.

## 5. Production deployment status

| Item | Status |
|---|---|
| GitHub repository | https://github.com/omkardeshpande017-ctrl/foodbridgefinal |
| Latest commit | `bcd0fab` (pinned Node 22.x); code commit `fe930f0` |
| Vercel build | **Succeeded** — "Build Completed", "Ready in 11s", deployment `turbo-jasper-yhwmqya` |
| Vercel public URL | **Blocked**: `https://turbo-jasper-yhwmqya.tmp.now` returns 403 `x-vercel-mitigated: deny` (anonymous temporary deployment; no account token in this environment) |
| Production MongoDB | **Not provisioned**: no Atlas/other connection string available |

## 6. What is required to finish (account access only)

1. **Vercel** — either a Vercel access token (vercel.com → Account Settings → Tokens) or run
   `npx vercel login` once in the project folder, then the existing `vercel.json` deploys the
   frontend and API as one public project.
2. **MongoDB Atlas** — a free cluster and its SRV connection string.

With those two values the remaining steps are one deploy plus a seed run
(`MONGO_URI=… ADMIN_EMAIL=… ADMIN_PASSWORD=… node backend/src/seed.js`), then
`node backend/test/smoke.js https://<host>/api` to verify the live site.
