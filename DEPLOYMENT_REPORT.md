# FoodBridge — Launch Report

Generated 2026-11-01 (Asia/Calcutta) · Project: `~/Downloads/foodbridge-final` · Repository:
https://github.com/omkardeshpande017-ctrl/foodbridgefinal

---

## 1. Architecture

```
Browser ──► React 18 / Vite 6 SPA (lazy routes, Tailwind, dark mode)
                │  JSON over HTTPS (JWT bearer, 2 h)
                ▼
        Express 4 API  (/api/*)  ──►  Mongoose 8  ──►  MongoDB 7
                │                                   (persistent, indexed)
                ├─ auth (bcrypt 12, DB-revalidated JWT, rate limited)
                ├─ donations · deliveries · users · analytics
                ├─ notifications · reports (disputes) · ai insights
                └─ AuditLog · Setting · health / ready / version
```

Deployment targets: `vercel.json` serves the static build and mounts the same Express app as a
serverless function at `/api/*`; `docker-compose.yml` runs mongo + api + web with healthchecks for
self-hosting. The backend is a plain Node service and runs unchanged on any container host.

## 1b. Latest increment — password management, secured Docker DB, docs

| Change | Detail |
|---|---|
| Change password | `POST /api/auth/change-password` — authenticated, verifies the current password, bcrypt re-hash |
| Forgot / reset password | `POST /api/auth/forgot-password` (SHA-256 hashed, single-use, 30-minute token; identical response for unknown emails) and `POST /api/auth/reset-password` |
| Hash exposure | `passwordHash` is `select: false` and stripped from every response |
| Admin bootstrap | `POST /api/setup/admin` gated by `SETUP_TOKEN`, `409` once an admin exists; optional first-boot provisioning from `ADMIN_EMAIL`/`ADMIN_PASSWORD` |
| Docker MongoDB auth | root username/password from `.env`, `authSource=admin` in the API URI, authenticated healthcheck, host port still loopback-only |
| Docs | `API.md` (every endpoint + transitions) and `OPERATIONS.md` (Docker, backup/restore, recovery, provisioning, GitHub→Vercel, monitoring) |
| Tests | suite extended to **62 checks**, all passing |

## 2. Features implemented (this launch)

| Area | Delivered |
|---|---|
| Donation lifecycle | `available → accepted → picked_up → in_transit → delivered` + `expired`, `cancelled`; atomic acceptance (no duplicate accept), timestamped history on every transition, `pickedUpAt`/`deliveredAt` |
| Expiry | real `expiresAt` from expiry/pickup time, auto-expire on read, past expiry rejected at creation, expired donations cannot be accepted |
| Donor | create/edit/delete, photo upload (≤1.5 MB validated), expiry validation, history, notifications, pagination/search/filters |
| NGO | organisation registration, verification gate before accepting, browse available, accept, release, assign volunteer, distribution tracking |
| Volunteer | availability toggle, only own tasks, `picked_up → in_transit → delivered` with ownership checks |
| Admin | user directory (search/filter/paginate), NGO verification, suspend/activate, disputes triage, audit log, platform settings, impact report |
| Security | JWT re-validated against the DB per request, security headers, auth rate limiting (40/15 min), strict validation, CORS allow-list, role guards, audit trail, no demo accounts |
| Analytics | role-scoped summary, network overview, 7-day trend, 6-month monthly trend, success rate, per-status breakdown — all computed from real records |
| Notifications | dedupe keys, unread counts, mark one / mark all |
| UI | donation detail with lifecycle timeline, dark mode, route-level code splitting (main bundle 693 kB → 198 kB), loading/empty/error states, responsive tables |
| Ops | `/api/health`, `/api/ready` (503 without DB), `/api/version`, Docker healthchecks, restart policies |

## 3. URLs and status

| Item | Value | Status |
|---|---|---|
| GitHub repository | https://github.com/omkardeshpande017-ctrl/foodbridgefinal | ✅ pushed |
| Latest commit | `9e4d82b` — "feat: password management, secured Docker MongoDB, API and ops docs" | ✅ pushed (launch commit `b08f9d7`) |
| Frontend (local) | http://localhost:5173 | ✅ running, verified in browser |
| API (local) | http://localhost:5001/api/health | ✅ `{"status":"ok","database":"connected"}` |
| Frontend (production) | — | ❌ blocked: no Vercel account access |
| API (production) | — | ❌ blocked: no host credentials |
| MongoDB (production) | local `mongod` (9.0.2) for all tests | ❌ no Atlas cluster |
| Vercel deployment | rebuilt after the latest commit (`Ready in 15s`), but every request returns `403 x-vercel-mitigated: deny` | ❌ anonymous temporary deployments are not publicly served; needs account access |
| Docker containers | `docker` is not installed on this machine | ⚠️ not executed; compose validated, Dockerfiles written |

## 3b. Credential rotation (performed)

The administrator password shown in an earlier local-testing report is treated as
compromised: it was rotated with `npm run seed`, the old password now returns `401`,
and no administrator password appears in this report, the README, the source or any
committed file (`git log -S` finds none). Local test helper scripts that contained it
were deleted. Rotate again before any public deployment.

## 4. Test results

`ADMIN_EMAIL=… ADMIN_PASSWORD=… npm test` → **62 passed, 0 failed** (real MongoDB).

| Suite | Command | Result |
|---|---|---|---|
| API behaviour | `npm test` | **62 / 62 passed** |
| Edge cases & permissions | `npm run test:edge` | **32 / 32 passed** |
| Full user journey (donor → NGO → volunteer → donor → admin) | `npm run test:journey` | **22 / 22 passed** |
| **Total** | `npm run test:all` | **116 / 116 passed** |

Browser (UI) verification, all four roles, no console errors observed:

| Flow | Result |
|---|---|
| Donor posts a donation → redirected to detail page, timeline shows *Available* | ✅ |
| Search in My Donations filters correctly | ✅ |
| Admin verifies the NGO (Pending → Verified) | ✅ |
| NGO finds the donation, accepts it, assigns a volunteer | ✅ |
| Volunteer advances *picked up → in transit → delivered* from /tasks | ✅ |
| Donor sees *Delivered* with the full 5-entry history and actors | ✅ |
| Donor opening /users is redirected to /dashboard (role guard) | ✅ |
| Analytics, AI, Map, Notifications, Profile, Dashboard render with live data | ✅ |

| Group | Checks | Result |
|---|---|---|
| Health / readiness / version | 3 | ✅ |
| Registration (donor, NGO, volunteer; admin blocked) | 4 | ✅ |
| Login (wrong password, correct, role from DB, protected route) | 4 | ✅ |
| Donations (create, role denial, validation, edit, delete, expiry rejection) | 10 | ✅ |
| Lifecycle (accept, duplicate accept 409, history, timestamps) | 7 | ✅ |
| Pickup & delivery (assign, ownership, 3 transitions, donation follows) | 8 | ✅ |
| NGO verification gate | 2 | ✅ |
| Analytics / insights | 5 | ✅ |
| Profile & users | 3 | ✅ |
| Admin (users, reports, audit log, settings, dispute resolve, suspend → login blocked) | 8 | ✅ |
| Security headers / pagination | 2 | ✅ |
| Password management (change, wrong current 401, reset token, enumeration-safe) | 8 | ✅ |

Browser verification (local, admin session): dashboard, Users (verification column + role filter),
Disputes, Reports, Audit Log, Settings, Analytics, AI Insights, Profile, donation detail
(lifecycle timeline, people panel), notifications and the dark-mode toggle all render with real
data — **no console errors, no failed API requests**.

Clean-clone verification: fresh `git clone` → `npm install` both apps → production build OK →
API boots and reports `database: connected`.

## 5. Database

- Collections: `users`, `donations`, `deliveries`, `notifications`, `auditlogs`, `reports`, `settings`.
- Indexes: unique email; role/status; `donations` on status+createdAt, donorId, ngoId, volunteerId,
  expiresAt, text index on name/description/location; `notifications` unique `(userId, dedupeKey)`.
- Persistence verified: records written by the API survive an API restart and are readable after
  reconnecting (`/api/donations?status=delivered` still returns the delivered rows).
- Backup/recovery: with a managed cluster, Atlas automated snapshots + `mongodump`/`mongorestore`
  documented in the README. **Not configured** — no production cluster exists yet.

## 6. Security checks performed

bcrypt cost 12 · JWT ≥32-char secret enforced at boot (API refuses to start otherwise) · token
revalidated against the database each request · admin self-registration rejected · suspended users
blocked at login and on every authenticated request · role-based route guards on all mutations ·
IDOR checks on donation/delivery/report endpoints · input validation and length caps · image payload
validation · CORS allow-list · security headers (nosniff, frame deny, referrer policy, CSP, HSTS in
production) · auth rate limiting · audit log of privileged actions · `.env*` ignored, no secrets in
the repository (verified on a clean clone).

## 7. Performance

Route-level code splitting (main bundle 693 kB → 198 kB, charts split out), lazy pages, indexed
queries, pagination on every list endpoint, lean() reads, connection pooling with a cached Mongoose
connection, immutable asset caching via Vercel headers / nginx, Docker image healthchecks.

## 8. Remaining blockers (external, account-bound)

1. **Vercel** — the repository deploys and builds, but a public URL needs an account:
   `npx vercel login` in `~/Downloads/foodbridge-final`, or a Vercel token. Without it every
   request to the deployment is refused with `403 x-vercel-mitigated: deny`.
2. **Managed MongoDB** — a MongoDB Atlas SRV string (`mongodb+srv://…`) is required for a database
   that survives independently of this MacBook.
3. **Docker** — Docker Desktop is not installed here, so `docker compose up` could not be executed;
   the compose file and both Dockerfiles are written and validated.

With (1) and (2) the remaining work is: deploy, run `node backend/src/seed.js` against Atlas,
and run `node backend/test/smoke.js https://<host>/api` to certify the live site — the same suite
that passes 54/54 locally.
