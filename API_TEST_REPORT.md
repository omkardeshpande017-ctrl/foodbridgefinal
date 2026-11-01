# API TEST REPORT

Generated 2026-11-01 · Target: the real Express API on `http://localhost:5001/api` backed by a real MongoDB.
Command: `npm run test:all` (three consecutive runs, all identical).

| Suite | File | Checks | Passed | Failed | Skipped | Blocked |
|---|---|---|---|---|---|---|
| Behaviour / integration | `backend/test/smoke.js` | 62 | 62 | 0 | 0 | 0 |
| Edge cases & permissions | `backend/test/edge.js` | 32 | 32 | 0 | 0 | 0 |
| Full user journey | `backend/test/journey.js` | 22 | 22 | 0 | 0 | 0 |
| **Total** | | **116** | **116** | **0** | **0** | **0** |

Run history: run 1 → 62/32/22 · run 2 → 62/32/22 · run 3 → 62/32/22 (zero failures each).

## Endpoints exercised

| Method | Endpoint | Cases covered | Result |
|---|---|---|---|
| GET | `/health` | liveness, database field | PASSED |
| GET | `/ready` | 200 with DB up | PASSED |
| GET | `/version` | api version + environment | PASSED |
| POST | `/setup/admin` | closed without `SETUP_TOKEN` (404/403/409) | PASSED |
| POST | `/auth/register` | donor, NGO, volunteer; duplicate email 409; missing fields 400; weak password 400; invalid email 400; `role: admin` 400; NGO without organisation 400 | PASSED |
| POST | `/auth/login` | correct 200, wrong password 401, unknown account 401, role read from DB | PASSED |
| POST | `/auth/change-password` | correct current 200, wrong current 401 | PASSED |
| POST | `/auth/forgot-password` | generic response, no account enumeration | PASSED |
| POST | `/auth/reset-password` | valid token 200, login with new password 200 | PASSED |
| GET | `/donations` | pagination metadata, donor scoping, search, status filter | PASSED |
| GET | `/donations/:id` | owner 200, other donor 403, unknown 404, invalid id 400 | PASSED |
| POST | `/donations` | create 201, NGO/volunteer 403, invalid input 400, past expiry 400, unsafe image 400 | PASSED |
| PATCH | `/donations/:id` | owner edit 200, other donor 403, closed donation 409 | PASSED |
| PATCH | `/donations/:id/status` | donor cancel 200, donor→picked_up 403, invalid status 400 | PASSED |
| POST | `/donations/:id/accept` | verified NGO 200, unverified 403, duplicate 409, donor 403 | PASSED |
| GET | `/deliveries` | volunteer sees only own assignments | PASSED |
| POST | `/deliveries` | NGO assigns 201, donor 403 | PASSED |
| PATCH | `/deliveries/:id` | picked_up → in_transit → delivered; other volunteer 403 | PASSED |
| GET/PATCH | `/users`, `/users/me`, `/users/volunteers` | admin list, profile update persists, non-admin 403 | PASSED |
| PATCH | `/users/:id/status` | suspend 200, suspended login 401 | PASSED |
| PATCH | `/users/:id/verification` | admin verify 200, non-admin 403 | PASSED |
| GET | `/analytics/summary`, `/overview`, `/audit`, `/settings`, `/public` | scoped totals, 7-day and 6-month trends, audit rows, settings read/write, anonymous aggregates | PASSED |
| GET | `/ai/insights` | rule-based method flag, insights, forecast | PASSED |
| POST/GET/PATCH | `/reports`, `/reports/mine`, `/reports/:id` | raise 201, non-admin 403, admin resolve 200 | PASSED |
| GET/PATCH/POST | `/notifications` | list with unread count, mark one, mark all | PASSED |
| OPTIONS | any `/api/*` | handled by the Express CORS middleware (not exercised through a browser preflight in this suite) | NOT TESTED |

## Error handling verified

`400` validation · `401` missing/expired token, bad credentials · `403` role, ownership,
suspension, unverified NGO · `404` unknown route and unknown record · `409` duplicate email,
duplicate acceptance, editing a closed donation · `429` auth rate limiter (observed while
writing the edge suite: more than 40 auth attempts in 15 minutes are refused) · `500`
guarded by centralised error handling.

`405` was reproduced **only** against the static Workers deployment (no API there); the
Express API itself never returns it. `502/503` were not produced locally (no proxy in the
path) — the client maps them to "temporarily unavailable".

## Notes

- Tests run against the developer database on this machine. They create their own
  accounts (`*.@journey.test`, `*.@edge.test`, `*.@foodbridge.test`); they never modify
  the administrator accounts or delete genuine records.
- Production smoke tests against a deployed API are **BLOCKED**: no production API exists.
