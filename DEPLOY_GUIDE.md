# 🚀 Deployment Guide — AI-LMS

This guide shows you how to deploy your project so anyone can access it online with a permanent URL.

**Result:**
- Frontend → `https://ai-lms.vercel.app` (or your chosen name)
- Backend → `https://your-app.up.railway.app`
- Quick share → `https://ailms.serveo.net` (when running locally)

---

## Step 1: Push Code to GitHub

1. Go to [github.com](https://github.com) → **New Repository**
2. Name it `ai-lms` → click **Create Repository**
3. Open a terminal in your project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-lms.git
git push -u origin main
```

> ⚠️ The `.gitignore` files will automatically prevent `.env` and `.venv` from being uploaded.

---

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → **Login with GitHub**
2. Click **New Project** → **Deploy from GitHub repo** → select `ai-lms`
3. Set the **Root Directory** to `backend`
4. Railway auto-detects Python — it will use your `Procfile` to start the server

### Add PostgreSQL Database
5. In your Railway project → click **+ New** → **Database** → **Add PostgreSQL**
6. Click on the PostgreSQL service → **Variables** tab → copy `DATABASE_URL`

### Set Environment Variables
7. Click on your backend service → **Variables** tab → add:
   - `DATABASE_URL` = (paste the value you copied)
   - Any other secrets (email credentials, API keys, etc.)

8. Railway will redeploy automatically. Copy your backend URL (looks like `https://xxx.up.railway.app`)

---

## Step 3: Set Up Database Tables on Railway

1. In Railway, click your PostgreSQL service → **Query** tab
2. Run your SQL to create tables (same SQL you used locally)

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Login with GitHub**
2. Click **Add New Project** → Import `ai-lms`
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:
   - Key: `VITE_API_URL`
   - Value: `https://your-app.up.railway.app` ← your Railway backend URL
5. Click **Deploy** — Vercel builds and deploys automatically!

> Your site is now live at `https://ai-lms.vercel.app` 🎉

---

## Step 5: Quick Local Sharing with Serveo

When running locally and want to share quickly:

1. Make sure `START_ALL.bat` is running
2. Double-click **`START_TUNNEL.bat`**
3. Share the URL: `https://ailms.serveo.net`

> Anyone on the internet can open this link while the tunnel is running.

---

## Summary

| Feature | How |
|---|---|
| Permanent public URL | Vercel + Railway (Steps 1-4) |
| Custom-ish subdomain | `ai-lms.vercel.app` |
| Quick local sharing | `START_TUNNEL.bat` → `ailms.serveo.net` |
| Server down page | Automatic (built into the app) |
| Local development | `START_ALL.bat` (same as before) |

---

## Updating Your Deployed Site

Whenever you make changes and want to update the live site:

```bash
git add .
git commit -m "Update: describe your changes"
git push
```

Vercel and Railway will **automatically redeploy** when you push to GitHub. ✅
