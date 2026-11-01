# END-TO-END TEST REPORT

Generated 2026-11-01 · Application under test: FoodBridge at `http://127.0.0.1:5173`
(React dev server) + `http://localhost:5001/api` (Express) + MongoDB.

## Automation used

- **API-level end-to-end:** `backend/test/journey.js` — a scripted journey that drives the
  real HTTP API for all four roles and asserts every response (22 checks).
- **Browser-level end-to-end:** an automated Chromium session driving the real UI (typing in
  forms, clicking the actual buttons, reading the rendered result). Playwright itself was not
  installed in this cycle — the equivalent browser automation available in this environment
  was used instead. **`PLAYWRIGHT_TEST_RESULTS.md` records that distinction explicitly.**

## Journey result — PASSED (22/22)

| Step | Assertion | Result |
|---|---|---|
| 1 | Donor, NGO and volunteer register | PASSED |
| 2 | NGO registers as `pending` | PASSED |
| 3 | Administrator signs in | PASSED |
| 4 | Admin verifies the NGO | PASSED |
| 5 | Donor creates a donation (`available`) | PASSED |
| 6 | NGO finds it via search on the available list | PASSED |
| 7 | NGO accepts it (`accepted`) | PASSED |
| 8 | NGO assigns the volunteer (delivery created) | PASSED |
| 9 | Volunteer sees only their own assignment | PASSED |
| 10 | Volunteer marks `picked_up` | PASSED |
| 11 | Volunteer marks `in_transit` | PASSED |
| 12 | Volunteer marks `delivered` | PASSED |
| 13 | Donor sees `delivered` with all five history entries | PASSED |
| 14 | `pickedUpAt` and `deliveredAt` timestamps recorded | PASSED |
| 15 | Admin reads the same donation and the overview counts it | PASSED |
| 16 | Audit trail contains create / accept / delivery events | PASSED |
| 17 | Profile update persists | PASSED |
| 18 | Donor notifications delivered | PASSED |

## Browser-level results — PASSED

| Flow | Observed result |
|---|---|
| Donor posts a donation | Redirected to the detail page; timeline shows *Available* with actor and timestamp |
| Search in My Donations | Matching record stays visible |
| Admin verifies an NGO | Badge changes Pending → Verified |
| NGO accepts a donation | Status *Accepted*, NGO recorded, item leaves the available list |
| NGO assigns a volunteer | Green confirmation "Volunteer assigned — the task now appears in their dashboard." |
| Volunteer task progression | *Assigned → Picked Up → In Transit → Delivered*, "Delivery completed" shown |
| Donor re-opens the donation | Status *Delivered*; history lists available, accepted, picked up, in transit, delivered with timestamps and actor names |
| Role guard | A donor opening `/users` is redirected to `/dashboard` |
| Registration | Success → dashboard; duplicate email, weak password and wrong password produce the exact API messages |
| Pages render | Dashboard, Donations, Analytics, AI, Map, Notifications, Profile, Users, Disputes, Reports, Audit Log, Settings — no blank screen, no stuck loader |
| Dark mode | Toggles and persists across reloads |

## Not covered / blocked

| Area | Status | Reason |
|---|---|---|
| Playwright suite | NOT TESTED | Playwright is not installed in this environment; equivalent browser automation was used |
| Responsive breakpoints (1440/1280/768/390/360) | NOT TESTED | No viewport-emulation capability in the browser tool used |
| Deployed-site E2E | BLOCKED | No production API exists; the public Worker host returns 405 for API calls |
| Browser back/forward navigation | NOT TESTED | Not exercised by the automation used |
