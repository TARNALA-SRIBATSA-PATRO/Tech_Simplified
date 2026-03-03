# Deploying Tech Simplified Backend on Render

## Overview

| Layer    | Service                                              |
|----------|------------------------------------------------------|
| Frontend | Vercel → `https://tech-simplified-sribatsa.vercel.app` |
| Backend  | Render Free Web Service (Docker)                     |
| Database | Neon PostgreSQL (serverless)                         |

---

## Step 1 — Connect GitHub to Render

1. Go to [https://render.com](https://render.com) and sign in.
2. Click **New → Web Service**.
3. Choose **Connect a GitHub repository** → select `Tech_Simplified`.

---

## Step 2 — Configure the Web Service

| Setting          | Value                          |
|------------------|--------------------------------|
| **Name**         | `tech-simplified-backend`      |
| **Root Directory** | `backend`                    |
| **Runtime**      | **Docker**                     |
| **Instance Type**| Free                           |

Render will auto-detect the `Dockerfile` inside `backend/`.

---

## Step 3 — Set Environment Variables

In **Environment → Environment Variables**, add all of the following:

| Key                 | Value                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------|
| `DB_URL`            | `jdbc:postgresql://ep-late-dew-a1nttd2t-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`       |
| `DB_USERNAME`       | `neondb_owner`                                                                                             |
| `DB_PASSWORD`       | `npg_aFevj23gNLAS`                                                                                         |
| `JWT_SECRET`        | A random string of **at least 32 characters** (generate one at https://generate-secret.vercel.app/64)     |
| `ADMIN_EMAIL`       | `tsribatsapatro@gmail.com`                                                                                 |
| `MAIL_USERNAME`     | `bibhuschatgpt@gmail.com`                                                                                  |
| `MAIL_APP_PASSWORD` | `wnay vffm nhcu sewi`                                                                                      |
| `FRONTEND_URL`      | `https://tech-simplified-sribatsa.vercel.app`                                                              |

Click **Save Changes**, then **Deploy**.

---

## Step 4 — Wait for Deployment

The first build takes ~5–10 minutes (Maven downloads dependencies). Watch the **Logs** tab. When the status shows **Live**, copy your service URL:

```
https://tech-simplified-backend.onrender.com
```

Test it:
```
curl https://tech-simplified-backend.onrender.com/api/blogs
```

---

## Step 5 — Update Vercel Frontend

1. Go to your Vercel project → **Settings → Environment Variables**.
2. Add (or update) `VITE_API_URL`:
   ```
   https://tech-simplified-backend.onrender.com/api
   ```
3. Click **Save**, then go to **Deployments → Redeploy** (latest deployment → ⋯ → Redeploy).
4. Visit your frontend and confirm blogs load.

---

## Free-Tier Notes

- Render free services **spin down** after 15 minutes of inactivity. The first request after sleep will take ~30–50 seconds while the container wakes up.
- Neon's free tier **auto-suspends** the compute (Idle) — the first DB query may also add a couple of seconds. Both are normal on free plans.
