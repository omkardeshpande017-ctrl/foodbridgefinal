# FoodBridge API — reference

Base URL: `https://<host>/api` (production) or `http://localhost:5001/api` (local).
All responses are JSON. Authenticated routes expect `Authorization: Bearer <jwt>`
(tokens expire after 2 hours; the account is re-checked against the database on
every request, so suspension and role changes apply immediately).

## System

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Liveness + database state |
| GET | `/ready` | – | Readiness — `503` when MongoDB is unreachable |
| GET | `/version` | – | API version, environment, commit |
| POST | `/setup/admin` | setup token | One-time administrator bootstrap; `409` once an admin exists |

## Authentication

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | – | `{ name, email, password, role: donor\|ngo\|volunteer, organization?, phone?, location?, registrationNumber?, skills? }` |
| POST | `/auth/login` | – | `{ email, password }` → `{ token, user }` |
| POST | `/auth/change-password` | user | `{ currentPassword, newPassword }` |
| POST | `/auth/forgot-password` | – | `{ email }` (always returns the same message) |
| POST | `/auth/reset-password` | – | `{ token, password }` |

Administrators cannot be created through registration. NGOs register with
`verification.status = pending` and can only accept donations after an admin
verifies them.

## Donations

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/donations` | user | Query: `page`, `limit`, `status`, `category`, `search`, `mine`, `available`. Returns `{ items, total, page, limit, pages }` |
| GET | `/donations/:id` | owner / NGO / assigned volunteer / admin | Includes populated parties and full `history` |
| POST | `/donations` | donor, admin | `{ foodName, quantity, unit, category, description, pickupLocation, pickupDate, pickupTime, expiryTime, image, notes }` |
| PATCH | `/donations/:id` | donor owner, admin | Editable while `available` |
| PATCH | `/donations/:id/status` | role-guarded | `{ status }` — see transitions below |
| POST | `/donations/:id/accept` | verified NGO | Atomic; `409` if no longer available or expired |
| DELETE | `/donations/:id` | donor owner (cancelled/expired), admin | — |

**Status transitions**

```
available ──accept (NGO)──► accepted ──picked_up──► picked_up ──in_transit──► in_transit ──► delivered
     │                          │
     └────cancel (donor)────────┴────cancel (donor or owning NGO)
available/accepted ──(expiresAt passed)──► expired        [automatic, on read]
```

Every transition appends `{ status, at, by, byRole, note }` to `history`.

## Deliveries

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/deliveries` | user | Volunteers see their own; NGOs see the ones they created |
| POST | `/deliveries` | NGO (own donation), admin | `{ donationId, volunteerId, pickup, dropoff }` — assigning notifies the volunteer |
| PATCH | `/deliveries/:id` | assigned volunteer, NGO, admin | `{ status }`: `assigned → picked_up → in_transit → delivered`; the donation follows |

## Users

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/users` | admin | `page`, `limit`, `role`, `status`, `search` |
| GET | `/users/volunteers` | admin, NGO | Active, available volunteers for assignment |
| GET | `/users/me` | user | Own profile |
| PATCH | `/users/me` | user | `name`, `phone`, `location`, `organization`, `registrationNumber`, `skills`, `available` |
| PATCH | `/users/:id/status` | admin | `{ status: active\|suspended }` (admins are protected) |
| PATCH | `/users/:id/verification` | admin | `{ status: pending\|verified\|rejected, note? }` for NGOs |

## Analytics, reports and platform

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/analytics/summary` | user | Role-scoped totals, pending/expired counts, efficiency |
| GET | `/analytics/overview` | user | Network totals, 7-day trend, 6-month trend, role counts, success rate |
| GET | `/analytics/audit` | admin | `page`, `limit`, `action`, `entity` |
| GET/PATCH | `/analytics/settings` | admin | Platform name, support email, expiry window, verification switch, image switch |
| GET | `/ai/insights` | user | Data-derived insights + 7-day projection (`method: rule-based`) |
| GET | `/reports/summary` | admin | Impact report used by the Reports page |
| POST | `/reports` | user | `{ subject, description, category, donationId?, reportedUserId? }` |
| GET | `/reports/mine` | user | Reports the caller raised |
| GET | `/reports` | admin | Triage queue (`status` filter, paginated) |
| PATCH | `/reports/:id` | admin | `{ status, resolution }` |

## Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | `{ items, unread }` for the caller |
| PATCH | `/notifications/:id/read` | Mark one read |
| POST | `/notifications/read-all` | Mark all read |

## Errors

`400` validation · `401` missing/expired token or bad credentials · `403` role or
ownership denial (also suspended accounts and unverified NGOs) · `404` not found ·
`409` conflict (duplicate acceptance, editing a closed donation) · `429` auth rate
limit · `500` unexpected server error.
