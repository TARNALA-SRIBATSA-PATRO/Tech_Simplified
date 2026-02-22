# 🚀 Railway Deployment Guide — Tech Simplified

This guide explains how to deploy the **Spring Boot backend** to **Railway** (permanent `*.up.railway.app` URL) and keep the **React/Vite frontend** on **Vercel**.

---

## Architecture

| Service  | Platform | URL Pattern |
|----------|----------|-------------|
| Backend  | Railway  | `https://<your-service>.up.railway.app` |
| Frontend | Vercel   | `https://tech-simplified-sribatsa.vercel.app` |
| Database | Neon     | PostgreSQL (unchanged) |

---

## Step 1 — Create a Railway Account

1. Go to **[railway.app](https://railway.app)** and sign up / log in using your **GitHub account**.
2. Railway gives you **$5 free credit/month** — more than enough for a Spring Boot app.

---

## Step 2 — Deploy the Backend

### Option A: Deploy from GitHub (Recommended)

1. On Railway dashboard → click **"New Project"**
2. Choose **"Deploy from GitHub repo"**
3. Select your **`Tech_Simplified`** repository
4. Railway will detect the project. When prompted for the **Root Directory**, type:
   ```
   backend
   ```
5. Railway will automatically use the `Dockerfile` inside `backend/`.
6. Click **Deploy** — Railway starts building.

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From the backend folder
cd backend
railway init
railway up
```

---

## Step 3 — Set Environment Variables on Railway

After the service is created, go to:
**Project → Your Service → Variables** tab → Add the following:

| Variable | Value |
|----------|-------|
| `DB_URL` | `jdbc:postgresql://<host>/<dbname>?sslmode=require` |
| `DB_USERNAME` | Your Neon DB username |
| `DB_PASSWORD` | Your Neon DB password |
| `JWT_SECRET` | Any long random string (min 32 chars) |
| `ADMIN_EMAIL` | `tsribatsapatro@gmail.com` |
| `MAIL_USERNAME` | `bibhuschatgpt@gmail.com` |
| `MAIL_APP_PASSWORD` | `kruw kzds honw vqir` |
| `FRONTEND_URL` | `https://tech-simplified-sribatsa.vercel.app` |

> **Note:** Railway automatically injects a `PORT` variable — you do NOT need to set it manually. Your `application.properties` already reads `server.port=${PORT:8080}`.

---

## Step 4 — Get Your Permanent Railway URL

1. After deployment succeeds, go to **Settings → Networking → Generate Domain**
2. Railway gives you a permanent URL like:
   ```
   https://tech-simplified-backend.up.railway.app
   ```
3. Copy this URL.

---

## Step 5 — Update Vercel Frontend Environment Variable

1. Go to your **Vercel project dashboard**
2. **Settings → Environment Variables**
3. Update (or add) `VITE_API_URL`:
   ```
   https://<your-service>.up.railway.app/api
   ```
4. **Redeploy** the frontend on Vercel (Deployments → Redeploy).

---

## Step 6 — Verify Everything Works

Test these URLs in your browser:

```
# Health check (should return a list of blogs)
GET https://<your-service>.up.railway.app/api/blogs

# Admin login endpoint
POST https://<your-service>.up.railway.app/api/admin/auth/request-otp
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check Railway build logs; make sure `pom.xml` is in `backend/` folder |
| App crashes on start | Check that all env vars (DB_URL, JWT_SECRET, etc.) are set |
| CORS errors from frontend | Make sure `FRONTEND_URL` is set to your exact Vercel URL |
| Health check failing | Wait ~3 minutes for JVM warm-up; Railway retries automatically |

---

## Files Added for Railway

- `backend/railway.json` — tells Railway to use the Dockerfile and sets the healthcheck path
- `backend/Dockerfile` — already exists and works perfectly with Railway

No changes needed to `application.properties` — it already reads all config from environment variables.
