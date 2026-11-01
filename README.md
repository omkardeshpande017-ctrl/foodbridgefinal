# FoodBridge — Food Donation, Pickup & Delivery Platform

FoodBridge connects food **donors** with **NGOs** and **volunteers** so surplus food is rescued
instead of wasted. It is a real full-stack application — React/Vite frontend, Express API,
MongoDB persistence, JWT authentication with role-based authorisation — not a UI mock.

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS, React Router 7, Recharts, lucide-react |
| Backend | Node.js 20+, Express 4, Mongoose 8, JWT, bcryptjs, CORS, morgan |
| Database | MongoDB 7 (local Docker/mongod or MongoDB Atlas) |
| Deployment | Vercel (frontend + serverless API) or Docker Compose, plus a managed MongoDB |

## Platform capabilities

| Area | What is implemented |
|---|---|
| Donations | create / edit / delete, category, quantity, expiry validation, pickup details, optional photo (≤1.5 MB), pagination, search, filters |
| Lifecycle | `available → accepted → picked_up → in_transit → delivered`, plus `expired` and `cancelled`; atomic, duplicate-safe acceptance; timestamped history per transition |
| Expiry | `expiresAt` computed from the expiry/pickup time; stale donations are auto-expired on read and cannot be accepted |
| Roles | donor, NGO (verified), volunteer, single administrator provisioned by seed |
| Admin | user directory, NGO verification, suspend/activate, disputes triage, audit log, platform settings, impact report |
| Security | bcrypt(12), JWT with DB-backed revalidation, role guards, CORS allow-list, security headers, auth rate limiting, input validation, audit trail, no client-supplied roles |
| Analytics | role-scoped summary, network overview, 7-day trend, 6-month monthly trend, success rate — all from real collections |
| Notifications | in-app with dedupe keys, mark-one/mark-all |
| Reliability | `/api/health`, `/api/ready` (503 when DB is down), `/api/version`, structured audit log, Docker healthchecks |

## Features

- **Donor dashboard** — post donations (food, quantity, safety window, pickup details), track every
  donation through its lifecycle, cancel before pickup, read impact stats and notifications.
- **NGO dashboard** — browse available donations, search and filter, accept a donation, see accepted
  requests, assign a volunteer, track distribution.
- **Volunteer dashboard** — see only the deliveries assigned to them, advance each one through
  *picked up → in transit → delivered*; the donation status follows automatically.
- **Admin** — provisioned privately by the seed script (never through public registration); manage
  users (activate/suspend), read reports and network-wide analytics.
- **Cross-cutting** — JWT auth with 2h expiry, role-based route guards, in-app notifications,
  data-derived analytics and a 7-day projection, rate limiting on auth, CORS allow-list.

## Documentation

| Document | Contents |
|---|---|
| [`API.md`](API.md) | Every endpoint, payload, status transition and error code |
| [`OPERATIONS.md`](OPERATIONS.md) | Docker stack, backup/restore, recovery, admin provisioning, GitHub→Vercel deployment, monitoring |
| [`DEPLOYMENT_REPORT.md`](DEPLOYMENT_REPORT.md) | Latest verified test results, deployment status and open blockers |

## Project layout

```
foodbridge-final/
├── api/index.js              # Vercel serverless entry (re-exports the Express app)
├── backend/
│   ├── src/server.js         # Express app (exports default app; listens locally)
│   ├── src/config/db.js      # cached Mongoose connection
│   ├── src/models/           # User, Donation, Delivery, Notification
│   ├── src/routes/           # auth, donations, deliveries, users, analytics, notifications, ai, reports
│   ├── src/middleware/auth.js# JWT verify + role guard
│   ├── src/seed.js           # idempotent admin provisioning
│   ├── test/smoke.js         # 35-check end-to-end API test
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/                  # React app (pages, components, services/api.js)
│   ├── Dockerfile            # build + nginx SPA server
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml        # mongo + api with a persistent named volume
├── vercel.json               # single-project deploy: static frontend + /api serverless function
└── package.json
```

## Local development

Requirements: Node.js 20+, npm, and MongoDB 7 — **Docker MongoDB is the default** (`docker compose`
runs mongo + api + web with authentication, a persistent volume and healthchecks); a local `mongod`
works too when Docker is unavailable.

### Docker MongoDB (default)

```bash
cp .env.example .env                     # JWT_SECRET, MONGO_ROOT_PASSWORD, ADMIN_*
JWT_SECRET=$(openssl rand -hex 32) docker compose up -d --build
docker compose exec api node src/seed.js
```

- Web: http://localhost:8080 · API: http://localhost:5001/api · Mongo: `127.0.0.1:27019` (password required)

Host ports are configurable because another local stack may already own 27017/27018/5001/8080.
Set them in `.env` (`MONGO_HOST_PORT`, `API_HOST_PORT`, `WEB_HOST_PORT`) and rebuild the web image
with a matching `VITE_API_URL`, because that value is compiled into the browser bundle:

```bash
API_HOST_PORT=5002 WEB_HOST_PORT=8081 MONGO_HOST_PORT=27019 \
  VITE_API_URL=http://localhost:5002/api docker compose up -d --build
```

### Without Docker

```bash
# 1. dependencies
npm run install-all

# 2. configuration
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit backend/.env: JWT_SECRET (openssl rand -hex 32), ADMIN_EMAIL, ADMIN_PASSWORD
# (12+ chars). There is exactly ONE primary administrator.

# 3. database (Docker)
docker compose up -d mongo

# 4. create the administrator accounts
npm run seed

# 5. run backend and frontend together
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5001/api
- Health: http://localhost:5001/api/health

The API refuses to start without a valid `JWT_SECRET` (32+ characters) and without a reachable
MongoDB. There is no demo mode, no in-memory fallback and no default password anywhere in the code.

## Database collections and indexes

`npm run db:init` creates every collection and index declared in the Mongoose schemas and the
default platform settings document. It is idempotent: it never drops a collection, never deletes a
document and never overwrites an existing setting. Run it after pointing `MONGO_URI` at a new
database (or `docker compose exec api node src/init-db.js` inside the stack).

| Collection | Purpose | Key indexes |
|---|---|---|
| `users` | Donors, NGOs, volunteers and the single administrator. NGO verification, volunteer availability, reset tokens. | unique `email`, `role`, `status`, `role+status`, `createdAt` |
| `donations` | Donation lifecycle (`available → accepted → picked_up → in_transit → delivered`, plus `expired`/`cancelled`), history, timestamps. | `status`, `donorId`, `ngoId`, `volunteerId`, `expiresAt`, compound `status+createdAt` and per-role `+createdAt`, text index on food name/description/location |
| `deliveries` | Pickup assignments and delivery tracking for a donation. | `volunteerId+createdAt`, `donationId` |
| `notifications` | Per-user notifications with dedupe keys and read state. | `userId`, `read`, `userId+dedupeKey`, `userId+createdAt` |
| `auditlogs` | Administrative and security activity log (who did what, when). | `actorId`, `action`, `entity`, `entityId`, `createdAt` |
| `reports` | Disputes/incidents raised by users and triaged by admins. | `raisedBy`, `status`, `status+createdAt` |
| `settings` | Platform settings document (`key: platform`). | unique `key` |

NGOs and volunteers are `users` with `role: 'ngo'` / `role: 'volunteer'` — one identity model, so
verification, suspension and audit apply to every role. Pickup assignments live in `deliveries`,
which references the donation and the volunteer, so a donation can never have two conflicting
active assignments.

## Accounts

Public registration offers **Donor, NGO or Volunteer** only. There is exactly **one primary
administrator**, created by `npm run seed` from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in the environment.
The seed is idempotent, never deletes existing users or donations, and demotes any other account
that holds the admin role to `donor`, so the platform can never end up with two primary admins.
The administrator password is bcrypt-hashed (cost 12), is never printed, and is changed through
`POST /api/auth/change-password`.

## Tests

```bash
npm test                                        # against http://localhost:5001/api
node backend/test/smoke.js https://<host>/api   # against a deployment
ADMIN_EMAIL=... ADMIN_PASSWORD=... npm test     # also runs the admin checks
```

`npm test` registers a donor, NGO and volunteer, creates a donation, accepts it, assigns a volunteer,
walks the delivery through picked up → in transit → delivered, then verifies analytics, insights,
profile updates, password management and the role-based denials.

| Suite | Checks |
|---|---|
| `npm test` (API behaviour) | 60 |
| `npm run test:edge` (permissions, abuse cases) | 32 |
| `npm run test:journey` (donor → NGO → volunteer → admin) | 22 |
| **Total** | **114** |

## Docker (full stack)

```bash
export JWT_SECRET=$(openssl rand -hex 32)
docker compose up -d --build
docker compose exec api node src/seed.js      # provision the administrator inside the container
```

- API: http://localhost:5001/api/health
- MongoDB data persists in the `foodbridge_mongo_data` volume.

To build the frontend image too (static nginx build pointed at any API):

```bash
docker build -f frontend/Dockerfile -t foodbridge-web \
  --build-arg VITE_API_URL=https://<your-api-host>/api frontend
```

## Deployment

### 1. MongoDB (persistent)

Create a free MongoDB Atlas cluster, a database user, and allow access from `0.0.0.0/0`
(or your host's egress IPs). Copy the SRV connection string:

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/foodbridge?retryWrites=true&w=majority
```

### 2. Backend + frontend on Vercel (one project)

`vercel.json` serves the Vite build statically and routes `/api/*` to `api/index.js`, which runs
the same Express app as a serverless function.

Environment variables (Project → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `MONGO_URI` | Atlas SRV string above |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `CLIENT_URL` | your production origin, e.g. `https://foodbridge.vercel.app` |
| `VITE_API_URL` | `https://<your-project>.vercel.app/api` (same-origin) or the API's own host |

Then provision the administrator once, from a machine with the same `MONGO_URI`:

```bash
cd backend && MONGO_URI='mongodb+srv://…' ADMIN_EMAIL=… ADMIN_PASSWORD=… \
  JWT_SECRET=… node src/seed.js
```

### 3. Backend on a long-running host (alternative)

`backend/` is a plain Node service: build with `backend/Dockerfile` (or `npm ci && npm start`) and
set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`. Health check: `/api/health`.

### 4. Verify

```bash
node backend/test/smoke.js https://<host>/api
```

## Security notes

- Secrets are never committed; `.env*` is ignored except `.env.example`.
- Passwords are hashed with bcrypt (cost 12); roles always come from the database, never the client.
- Admin self-registration is rejected; a suspended user cannot sign in.
- CORS is an explicit allow-list (`CLIENT_URL`), with Vercel preview origins permitted.
- Auth endpoints are rate limited per IP + email (40 attempts / 15 min).
- Use HTTPS in production and rotate `JWT_SECRET` and the admin passwords before sharing the URL.
