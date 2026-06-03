# Vercel Deployment Guide

## 1. MongoDB Atlas Configuration

### Step 1: Whitelist Vercel IPs

1. Go to MongoDB Atlas Dashboard → Network Access
2. Add 0.0.0.0/0 (allows all IPs) for production, or add these Vercel ranges:
   - 76.75.14.0/24
   - 98.198.198.0/24
   - 34.212.75.0/24

### Step 2: Create Database User

1. Go to Database Access
2. Create a new user with:
   - Username: `satkhirar-admin`
   - Password: (use strong password)
   - Grant roles: "Atlas Admin" or "readWriteAnyDatabase"

### Step 3: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Drivers" → Node.js
3. Copy the connection string and replace:
   - `<username>` with your database user
   - `<password>` with the password
   - `<cluster-name>` with your cluster name

## 2. Vercel Environment Variables Setup

In your Vercel project dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://satkhirar-admin:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=satkhirar-amm
MONGODB_SERVER_SELECTION_TIMEOUT_MS=10000
PRODUCT_QUERY_TIMEOUT_MS=3000
JWT_SECRET=your-secret-key-min-32-chars
CLIENT_ORIGINS=https://your-website.vercel.app,https://your-dashboard.vercel.app
ALLOW_VERCEL_PREVIEWS=true
ADMIN_NAME=Satkhirar Amm Admin
ADMIN_EMAIL=admin@satkhiraramm.com
ADMIN_PHONE=01700000000
ADMIN_PASSWORD=strong-password-here
SKIP_DATABASE_SEED=false
NODE_ENV=production
```

In Vercel, keep the project Root Directory set to:

```
Satkhirar Amm - backend
```

## 3. Vercel Deployment Steps

```bash
# 1. Connect your repository to Vercel
vercel link

# 2. Set environment variables in Vercel dashboard (or use CLI)
vercel env add

# 3. Deploy
vercel deploy --prod
```

## 4. Troubleshooting

### Error: "ENOTFOUND mongodb.net"

- **Issue**: MongoDB Atlas network not accessible
- **Solution**: Whitelist 0.0.0.0/0 in MongoDB Atlas Network Access

### Error: "unauthorized: auth failed"

- **Issue**: Database username/password incorrect
- **Solution**: Check MongoDB URI in environment variables

### Error: "Malformed JSON"

- **Issue**: Invalid request body
- **Solution**: Check `express.json({ limit: "12mb" })` in app.js

### Build fails on Vercel

- **Issue**: Missing dependencies or syntax errors
- **Solution**: Run `npm run build` locally to debug
