# LifeDrop – MERN Blood Donation Platform

## Local run
- Server: `cd server`, copy `.env.example` to `.env` (Windows: `copy .env.example .env`), fill it, then `npm i` and `npm run dev` (port 5000)
- Client: `cd client`, `npm i`, `npm run dev` (port 5173, proxies /api)

## Deploy (both on Vercel)
1. Push to GitHub (`client/`, `server/`, `.gitignore`). Never commit `.env`.
2. Atlas: Network Access -> allow 0.0.0.0/0.
3. Vercel project 1 (backend): Root Directory `server`, Framework Other.
   Env vars: MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD. Open `<url>/api/donors` -> `[]`.
4. Vercel project 2 (frontend): Root Directory `client`, Framework Vite.
   Env var: VITE_API_URL = `<backend-url>/api`. Redeploy after changing env vars.
