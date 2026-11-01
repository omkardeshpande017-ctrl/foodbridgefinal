# PLAYWRIGHT TEST RESULTS

**Status: NOT RUN — Playwright is not installed in this environment.**

This file exists so the distinction is unambiguous: the end-to-end coverage in this
repository was produced by two other means, and no Playwright test suite was executed.

| Item | Value |
|---|---|
| Playwright version | not installed |
| Test files (`*.spec.ts` / `*.spec.js`) | none in the repository |
| Tests executed | 0 |
| Passed / Failed / Skipped | 0 / 0 / 0 |
| Status | **NOT TESTED** |

## What was executed instead

1. **`backend/test/journey.js`** — 22 assertions driving the real HTTP API end to end for all
   four roles (donor → NGO → volunteer → donor → admin). Passed 22/22, three consecutive runs.
2. **Browser automation** — an automated Chromium session that typed into the real forms and
   clicked the real buttons on `http://127.0.0.1:5173`, verifying rendered text after each
   action (registration, login, verification, acceptance, assignment, the three delivery
   transitions, the donor's final view, and role guards). All flows passed; results are
   recorded in `E2E_TEST_REPORT.md`.

## To add a real Playwright suite

```bash
npm i -D @playwright/test
npx playwright install chromium
# then: npx playwright test
```

Recommended first specs, mirroring what already passes by hand:

- `auth.spec.ts` — register each role, login, wrong password, duplicate email.
- `donation.spec.ts` — create → accept → assign → picked up → in transit → delivered.
- `admin.spec.ts` — verify an NGO, suspend a user, read the audit log.
- `guards.spec.ts` — a donor visiting `/users` is redirected to `/dashboard`.

These map 1:1 to the assertions in `backend/test/journey.js`, so porting them is mechanical.
