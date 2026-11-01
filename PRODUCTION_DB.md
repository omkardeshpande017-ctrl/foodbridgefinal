# Production database — the one step that needs your MongoDB account

## What is verified right now

| Item | Status | Evidence |
|---|---|---|
| Docker MongoDB 7 | ✅ running, healthy | `foodbridge-mongo  Up (healthy)  0.0.0.0:27019->27017/tcp` |
| Backend → Docker MongoDB | ✅ connected | `{"database":"connected","mongoTarget":"mongodb://***@mongo:27017/foodbridge"}` |
| Container network | ✅ by service name | the API uses `mongo:27017`, never localhost |
| Persistent volume | ✅ survives restart | `remote_foodbridge_mongo_data`; a donation created before `docker compose restart` still returned after it |
| Registration / login / users / donation CRUD | ✅ all pass on the Docker stack | 60 + 32 + 22 checks |
| Production backend → production database | ❌ **no production database exists yet** | live `/api/health` → `database: disconnected`, `mongoTarget: not set` |

The live site cannot reach a database because there is nothing to reach: no Atlas cluster (or any
other managed MongoDB) has been created for this project, and creating one requires your MongoDB
account. That is the only remaining blocker.

## The 3-minute fix (MongoDB Atlas, free tier)

1. https://cloud.mongodb.com → sign in → **Create** → **M0 / Free** → provider AWS, region **Mumbai (ap-south-1)**.
2. **Database Access** → *Add New Database User*
   - username: `foodbridge`
   - password: **Autogenerate** and copy it
   - role: *Read and write to any database*
3. **Network Access** → *Add IP Address* → `0.0.0.0/0`
   (Vercel functions have no fixed egress IP; for a stricter setup, allow only the Atlas
   Private Endpoint or your own proxy.)
4. **Connect → Drivers → Node.js** → copy the string and insert the database name:

   ```
   mongodb+srv://foodbridge:<password>@cluster0.xxxxx.mongodb.net/foodbridge?retryWrites=true&w=majority
   ```

## Then set it in production (I can do this for you)

```bash
# once the value is set, the API reports database: connected on /api/health
curl -X POST https://api.vercel.com/v10/projects/prj_qc3X5IBJnkqCfpssuJP9mhCgzTjV/env \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H 'Content-Type: application/json' \
  -d '{"key":"MONGO_URI","value":"mongodb+srv://…","type":"plain","target":["production"]}'
```

Send me the string and I will:

1. store it as `MONGO_URI` for Production only (never in the repo, never in a frontend bundle),
2. redeploy,
3. `GET /api/health` → expect `{"status":"ok","database":"connected","mongoTarget":"mongodb+srv://***@cluster0.xxxxx.mongodb.net/foodbridge"}`,
4. provision the single administrator (`POST /api/setup/admin` with `SETUP_TOKEN`),
5. run `smoke` / `edge` / `journey` against the live URL — 60 + 32 + 22 checks,
6. verify registration, login, donation CRUD and persistence on the live site.

## Why `localhost` and `mongo:27017` are not used in production

- `mongo:27017` only resolves inside the Docker network on this machine.
- `localhost` inside a Vercel function is the function's own sandbox — there is no database there.
- Production therefore needs an internet-reachable MongoDB with TLS and a password: Atlas M0,
  Atlas paid tier, or any compatible managed service (DocumentDB, Azure Cosmos Mongo, self-hosted
  with TLS). The code already sets `tls: true` for `mongodb+srv://` URIs.

## Connection behaviour in the code (already shipped)

- `connectDBWithRetry()` — exponential backoff (5 attempts at boot, 2–3 on a cold request) so a
  starting database or a cold container is not treated as a hard failure.
- `/api/health` — only reports `connected` after a real `ping` command succeeds, and returns **503**
  with `status: "degraded"` otherwise. It also prints `mongoTarget`, which never contains credentials.
- Data routes answer **503** immediately with the reason instead of hanging until the platform timeout.
- Boot logs print `Connecting to MongoDB at mongodb://***@mongo:27017/foodbridge` — credentials are
  never written to logs.
