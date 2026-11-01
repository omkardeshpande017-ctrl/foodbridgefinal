# SECURITY TEST REPORT

Generated 2026-11-01. Scope: the FoodBridge Express API and React client as they exist at
commit `ff99316`.

| Control | Implementation | Verification | Status |
|---|---|---|---|
| Password hashing | bcrypt, cost 12 | hashes never leave the server; `passwordHash` is `select: false` and stripped from responses | PASSED |
| Password policy | 8–128 characters, enforced server-side and mirrored in the UI | weak-password assertion (400) | PASSED |
| JWT | 32+ character secret required at boot; the API exits if missing or placeholder | server refuses to start without it | PASSED |
| Token freshness | middleware re-reads the account per request (role, suspension, verification) | suspension blocks the next request | PASSED |
| Admin provisioning | seed or one-time `/setup/admin` gated by `SETUP_TOKEN`; public registration rejects `role: admin` | assertions for both paths | PASSED |
| Role authorisation | `roles()` guard on every privileged route | 12 role-denial assertions | PASSED |
| Ownership (IDOR) | donations, deliveries, reports compared against the record owner | cross-donor read/edit 403; cross-volunteer update 403 | PASSED |
| Input validation | shared helpers: email, string caps, numeric bounds, enum whitelists, image payload regex | 15 invalid-input assertions | PASSED |
| CORS | explicit `CLIENT_URL` allow-list + Vercel preview pattern; loopback only outside production | `https://evil.com` receives no allow-origin header | PASSED |
| Security headers | `nosniff`, `X-Frame-Options: DENY`, referrer policy, CSP, COOP, permissions policy, HSTS in production | header assertion in the suite | PASSED |
| Rate limiting | 40 auth attempts / 15 min per IP+email | 429 observed under load | PASSED |
| Account enumeration | `forgot-password` returns an identical body for unknown emails | assertion | PASSED |
| Reset tokens | 32-byte random, stored as SHA-256 hash, single use, 30-minute expiry, never returned in production | token round-trip test | PASSED |
| Secrets in Git | `.env*` ignored except `.env.example`; `git log -S` finds no password | clean clone inspection | PASSED |
| Credential rotation | administrator passwords rotated; the previously printed value now returns 401 | login assertions | PASSED |
| Logging | morgan (dev only), structured audit log of privileged actions; no secrets logged | audit rows inspected | PASSED |
| Sensitive fields | no password hash, reset token or JWT secret in any response body | login/register response inspection | PASSED |

## Known gaps (honest list)

1. **No CSRF protection** — not required for a bearer-token API with no cookie session, but
   worth stating explicitly.
2. **Rate limiting is in-process** — it resets on restart and is per instance. A multi-instance
   deployment needs a shared store (Redis) for a hard guarantee.
3. **No email provider configured** — password-reset tokens are only issued; delivery needs
   `SMTP_URL`/`RESET_LINK_BASE`. In development the token is returned to the client by design.
4. **Image uploads are data URLs** capped at ~1.5 MB; no virus scanning or re-encoding.
5. **No WAF/bot protection** in front of the API — depends on the eventual host.
6. **Dependency audit** (`npm audit`) was not run in this cycle — **NOT TESTED**.
7. **TLS/HSTS in production** cannot be verified until a production host exists — **BLOCKED**.
