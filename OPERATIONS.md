# FoodBridge — operations runbook

## Local development with Docker MongoDB

```bash
cp .env.example .env            # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN2_*
JWT_SECRET=$(openssl rand -hex 32) docker compose up -d --build
docker compose ps               # all three containers should report (healthy)
docker compose exec api node src/seed.js   # provision the administrator(s)
```

- `foodbridge-mongo` — MongoDB 7, persistent volume `foodbridge_mongo_data`,
  bound to `127.0.0.1:27018` on the host (never published publicly).
- `foodbridge-api` — Express API on `:5001`, connects with
  `MONGO_URI=mongodb://mongo:27017/foodbridge` (service name, not localhost).
- `foodbridge-web` — nginx serving the Vite build on `:8080`, SPA fallback.

Without Docker (this Mac), the same database is available from the local
`mongod` install: `mongod --dbpath ~/data/db` and `MONGO_URI=mongodb://127.0.0.1:27017/foodbridge`.

### Persistence check

```bash
docker compose exec api node -e "console.log('ok')"
curl -s localhost:5001/api/health        # database: connected
docker compose restart mongo api         # data must survive
curl -s localhost:5001/api/health
```

## Backup and restore

```bash
# Backup (whole database, gzip archive)
docker compose exec -T mongo mongodump \
  --db foodbridge --archive=/data/db/backup.gz --gzip
docker compose cp mongo:/data/db/backup.gz ./backups/foodbridge-$(date +%F).gz

# Restore into the running container
docker compose cp ./backups/foodbridge-2026-11-01.gz mongo:/data/db/restore.gz
docker compose exec -T mongo mongorestore --archive=/data/db/restore.gz --gzip --drop
```

For a managed cluster use `mongodump --uri "$MONGO_URI"` / `mongorestore --uri "$MONGO_URI"`,
and enable the provider's automated daily snapshots with a 7–30 day retention.

### Recovery procedure

1. Provision a new cluster or container (empty database).
2. `mongorestore --uri "$NEW_MONGO_URI" --gzip --archive=backup.gz --drop`.
3. Point `MONGO_URI` at the restored instance, redeploy, then
   `curl /api/health` → `database: connected` and `node backend/test/smoke.js <url>`.
4. Rotate `JWT_SECRET` if the old instance may have been compromised (all sessions
   are invalidated; users simply sign in again).

## Administrator provisioning

- Preferred: `npm run seed` (or `docker compose exec api node src/seed.js`) with
  `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN2_*` in the environment. Idempotent — it
  never deletes users or donations.
- Serverless/first boot: set `SETUP_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and start
  the API once (it provisions the admin automatically), or call
  `POST /api/setup/admin { token, email, password }`. Once an admin exists the
  endpoint returns `409` forever.

## Production deployment (GitHub → Vercel)

1. Import `omkardeshpande017-ctrl/foodbridgefinal` in Vercel. `vercel.json` already
   defines the install/build commands, the `frontend/dist` output and the `/api`
   serverless function, so no framework guessing is needed.
2. Environment variables (Production + Preview):
   `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `VITE_API_URL=/api`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SETUP_TOKEN` (optional).
3. Every push to `main` triggers a production deployment; other branches produce
   preview URLs.
4. After the first deploy call `POST /api/setup/admin` once, or keep the admin
   variables and let the first boot provision it.
5. Verify: `node backend/test/smoke.js https://<deployment>/api`.

## Monitoring

- `GET /api/health` (liveness) and `GET /api/ready` (503 without MongoDB) are safe
  for uptime monitors; `/api/version` reports the deployed commit.
- Server logs: `docker compose logs -f api`, or the platform's log viewer.
- Privileged actions are recorded in the `auditlogs` collection and visible under
  Admin → Audit Log.
