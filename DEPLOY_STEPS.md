# FoodBridge — go-live runbook (2 credentials, ~15 minutes)

Everything that can be done without your accounts is done: the code is fixed and pushed, the
Docker stack is healthy, and all 114 API checks pass. Two things need *your* login — a public
frontend host and a persistent database + API host. Pick one path below.

---

## Path A (recommended): everything on Vercel + MongoDB Atlas

### 1. MongoDB Atlas (persistent database)

1. https://cloud.mongodb.com → **Create** → **M0 (free)** → region Mumbai (`ap-south-1`).
2. **Database Access** → *Add New Database User* → username `foodbridge`, **Autogenerate** password
   (copy it), role *Read and write to any database*.
3. **Network Access** → *Add IP Address* → `0.0.0.0/0` (Vercel functions have no fixed egress IP).
4. **Connect → Drivers** → copy the string and add the database name:
   `mongodb+srv://foodbridge:<password>@cluster0.xxxxx.mongodb.net/foodbridge?retryWrites=true&w=majority`

### 2. Vercel project (frontend + API in one project)

1. https://vercel.com/new → import `omkardeshpande017-ctrl/foodbridgefinal` → **root directory: `.`**
   (the repo root; `vercel.json` already defines install/build/output and the `/api` function).
2. Environment variables (Production **and** Preview):

   | Key | Value |
   |---|---|
   | `MONGO_URI` | the Atlas string from step 1 |
   | `JWT_SECRET` | output of `openssl rand -hex 32` |
   | `CLIENT_URL` | `https://<project>.vercel.app` |
   | `VITE_API_URL` | `https://<project>.vercel.app/api` |
   | `SETUP_TOKEN` | any long random string (used once, in step 4) |

3. Deploy. Because the frontend and the API share one origin, `VITE_API_URL` needs no second host.

### 3. Provision the one administrator (once)

Either set `ADMIN_EMAIL` + `ADMIN_PASSWORD` (+ `SETUP_TOKEN`) in Vercel and let the first request
provision it, or call the endpoint once:

```bash
curl -X POST https://<project>.vercel.app/api/setup/admin \
  -H 'Content-Type: application/json' \
  -d '{"token":"<SETUP_TOKEN>","email":"you@example.com","password":"<12+ chars>"}'
```

The endpoint returns `409` once an administrator exists. No password is ever printed or committed.

### 4. Certify the live site

```bash
node backend/test/smoke.js https://<project>.vercel.app/api
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='<password>' \
  node backend/test/journey.js https://<project>.vercel.app/api
```

Expected: `60 passed` and `22 passed`.

---

## Path B: frontend on Vercel, API on a container host (Render/Railway/Fly)

1. Deploy `backend/` with `backend/Dockerfile`. Environment: `MONGO_URI`, `JWT_SECRET`,
   `CLIENT_URL=https://<vercel-app>` , `PORT=5001`. Health check path: `/api/health`.
2. Run the seed once in that container: `node src/seed.js` with `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
3. Vercel project for the frontend only: set `VITE_API_URL=https://<api-host>/api`, deploy.
4. Certify with the same two commands against `https://<api-host>/api`.

---

## Which commands I run for you

Tell me "Vercel and Atlas are ready" plus the values you want me to use (or just say *go* after
running `npx vercel login` locally), and I will run the deployment, provision the administrator,
run both suites against the live URL, and report the final URLs.

## Current local verification (already done)

```bash
docker compose up -d --build      # mongo + api + web, all healthy
docker compose exec api node src/seed.js
node backend/test/smoke.js   http://localhost:5002/api   # 60/60
node backend/test/edge.js    http://localhost:5002/api   # 32/32
node backend/test/journey.js http://localhost:5002/api   # 22/22
```
