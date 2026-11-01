# FoodBridge — command reference

```bash
# install
npm run install-all

# configure
cp backend/.env.example backend/.env      # JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
cp frontend/.env.example frontend/.env    # VITE_API_URL

# database
docker compose up -d mongo

# provision admins (idempotent, safe to re-run)
npm run seed

# run everything
npm run dev                # backend :5001 + frontend :5173
npm run backend            # backend only
npm run frontend           # frontend only

# build / test
npm run build              # production frontend build -> frontend/dist
npm run check              # backend syntax check
npm test                   # 35-check end-to-end API test

# docker (full stack)
export JWT_SECRET=$(openssl rand -hex 32)
docker compose up -d --build
docker compose exec api node src/seed.js
```
