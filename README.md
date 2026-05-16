# Satkhirar Amm Backend

Express + MongoDB API for the Satkhirar Amm website and dashboard.

## Local Development

```bash
npm install
npm run dev
```

Create or update the dashboard admin from `.env`:

```bash
npm run admin:create
```

Reset operational data while keeping users and products:

```bash
npm run data:reset
```

Health checks:

```bash
GET http://localhost:5000/health
GET http://localhost:5000/health/db
```

## Vercel Deployment

This backend is Vercel-ready. `src/app.js` exports the Express app for Vercel, while `src/server.js` is only for local `npm run dev`.

In Vercel, set the project root to this folder:

```txt
Satkhirar Amm - backend
```

Add these Environment Variables in Vercel:

```txt
MONGODB_URI
MONGODB_DB_NAME
JWT_SECRET
CLIENT_ORIGINS
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PHONE
ADMIN_PASSWORD
SKIP_DATABASE_SEED
ALLOW_VERCEL_PREVIEWS
```

Use your deployed frontend URLs in `CLIENT_ORIGINS`, separated by commas.

After deployment, update the website and dashboard apps:

```txt
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

MongoDB Atlas must allow Vercel traffic. For quick testing, add `0.0.0.0/0` in Atlas Network Access. For stricter production networking, use the network controls available in your Atlas/Vercel plans.
