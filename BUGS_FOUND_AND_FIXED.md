# BUGS FOUND AND FIXED

Every entry below is a defect reproduced against the real application, with the evidence
that proved it and the commit that fixed it. Nothing here is a cosmetic change made to
hide a symptom.

---

## BUG-1 — Production bundle hard-coded `http://localhost:5001/api`

**Symptom:** deployed login page showed `Failed to fetch`.
**Evidence:** `grep` of the live deployed asset returned `"http://localhost:5001/api"`; the
source of the value was `frontend/.env` (`VITE_API_URL=http://localhost:5001/api`), which
`vite build` loads in *every* mode and inlines into the bundle.
**Root cause:** a local-only env file was being compiled into the production build.
**Fix:** `frontend/src/services/api.js` now rejects a localhost `VITE_API_URL` in a
production build, falls back to same-origin `/api`, and the dev fallback is assembled at
runtime so no localhost URL can be inlined. `frontend/.env` removed.
**Verification:** 0 occurrences of `localhost:5001` in the built asset and in the redeployed
live asset. Commit `1ab1bb5`.

---

## BUG-2 — `405` presented as a transient error

**Symptom:** deployed login page showed
`The server could not complete this request (405). Please try again.`
**Evidence:**
```
POST https://foodbridge.defiant-technician-1cf.workers.dev/api/auth/login  -> 405, empty body
OPTIONS <same path>                                                       -> 405
GET     <same path>                                                       -> 200 (index.html)
```
**Root cause:** the host is a static-assets Worker. There is no API route, so a POST is
answered by the static layer with 405 and an empty body. The client treated any unknown
status as "try again", which is misleading: retrying can never succeed.
**Fix:** `serverError()` in `services/api.js` now maps 405 to an explicit configuration
message ("No FoodBridge API is connected to this deployment…"), logs the real cause, and
keeps 502/503/504 as genuine transient failures.
**Verification:** the new message is present in the redeployed live bundle (commit
`f4c…`, Worker version `57111601`); the underlying 405 is unchanged because it is
**BLOCKED** on deploying a backend (see DEPLOYMENT_REPORT.md).

---

## BUG-3 — A donor could edit or delete another donor's donation

**Symptom:** an unrelated donor account received `200` when PATCHing someone else's donation.
**Evidence:** `backend/test/edge.js` — "other donor cannot edit it" returned `200`.
**Root cause:** ownership was tested against the caller's *role* instead of the record's
`donorId`.
**Fix:** both `PATCH /api/donations/:id` and `DELETE /api/donations/:id` now compare the
record owner, allowing admins only as an override. Regression test added.
**Verification:** both assertions now return `403`. Commit `2317287`.

---

## BUG-4 — API returned `401` for any request after a suspension, and ignored role changes

**Symptom:** suspension only took effect at the next token refresh; NGO verification could
be granted but the token still said `pending`.
**Root cause:** `auth` middleware trusted JWT claims only.
**Fix:** the middleware re-reads the account from MongoDB on every request (role,
suspension, verification) and attaches the fresh values.
**Verification:** "suspended user cannot log in" and the verification gate tests pass.
Commit `b08f9d7`.

---

## BUG-5 — Same-day donations expired instantly and could never be accepted

**Symptom:** `POST /api/donations/:id/accept` returned `409 "This donation has expired"` for a
donation created minutes earlier.
**Root cause:** `expiresAt` was derived from the pickup date at 23:59 local, which for a
same-day pickup is already in the past when the pickup time has passed.
**Fix:** expiry is validated at creation (must be in the future), the accept query requires
`expiresAt > now`, and stale records are expired on read. Tests now use a future pickup
date and a dedicated "past expiry rejected" assertion.
**Verification:** accept/duplicate-accept/expired cases pass. Commit `2317287`.

---

## BUG-6 — Demo/sample seeding could write fake records into a database

**Symptom:** `npm run seed` created `donor.local@foodbridge.test` style accounts and sample
donations when `SEED_SAMPLE_*` was enabled.
**Fix:** the sample-seeding block was deleted. The seed now provisions administrators only;
fixtures live exclusively in `backend/test/`. Commit `6f2283b`.

---

## BUG-7 — Dev server on `127.0.0.1` was blocked by CORS

**Symptom:** every request from a dev server opened on `127.0.0.1:5173` failed with a network
error while `localhost:5173` worked.
**Root cause:** the CORS allow-list contained only `CLIENT_URL`.
**Fix:** loopback origins (localhost / 127.0.0.1 / [::1], any port) are allowed when
`NODE_ENV !== 'production'`; production keeps the strict allow-list. Commit `744bcca`.

---

## BUG-8 — Fake content on the AI, Analytics, Map and Home pages

**Symptom:** "Demo / Mock AI" banner with a hard-coded payload; a `safetyRate` bar that was
always 0; non-functional city/category/date filters; a marketing page with invented totals
(18,640 kg, 1,248 donors).
**Fix:** AI insights, analytics trends, the landing figures and the map copy now render only
API data (`/api/ai/insights`, `/api/analytics/overview`, new `/api/analytics/public`) with
loading, empty and unreachable states. Commits `48a91cc`, `2a01462`.
