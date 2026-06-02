# MongoDB Atlas Setup for Vercel - Step by Step

## 📍 Prerequisites

- MongoDB Atlas account (free tier works)
- Vercel project already created
- Basic understanding of MongoDB

## 🔧 Step 1: MongoDB Atlas Network Access Setup

### 1.1 Allow Vercel IPs

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your organization/project
3. Click on **Network Access** (left sidebar)
4. Click **+ ADD IP ADDRESS**

**Option A: Allow All (Easiest - for staging/testing)**

- Click **ALLOW ACCESS FROM ANYWHERE**
- Enter: `0.0.0.0/0`
- Click **Confirm**

**Option B: Allow Specific Vercel IPs (More Secure - for production)**

- Click **ADD IP ADDRESS**
- Add these IP ranges one by one:
  - `76.75.14.0/24`
  - `98.198.198.0/24`
  - `34.212.75.0/24`
  - `104.21.0.0/16`
  - `172.65.0.0/16`

## 🔐 Step 2: Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **+ CREATE DATABASE USER**
3. Fill in the form:
   - **Username**: `satkhirar-admin`
   - **Password**: (click **Autogenerate Secure Password**)
   - **User Privileges**: Select **Atlas Admin** (for full access)
   - Click **Create User**
4. **IMPORTANT**: Save the username and password somewhere safe!

## 📋 Step 3: Get MongoDB Connection String

1. Click on your cluster (e.g., "Cluster0")
2. Click **CONNECT** button
3. Choose **Drivers** option
4. Select **Node.js** from the dropdown
5. Copy the connection string

**Your connection string will look like:**

```
mongodb+srv://satkhirar-admin:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. **Replace `PASSWORD`** with the password you generated in Step 2
7. **Keep this URL safe** - you'll need it for Vercel

## 🌐 Step 4: Create Database (Optional)

1. Go to **Databases** (left sidebar)
2. Click on your cluster
3. Click **+ CREATE DATABASE**
4. Database name: `satkhirar-amm`
5. Collection name: (leave empty, app will create collections)
6. Click **Create**

## 🚀 Step 5: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Click **+ ADD**

Add these variables (for **Production** deployment):

| Key               | Value                                                                                            | Scope      |
| ----------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| `MONGODB_URI`     | `mongodb+srv://satkhirar-admin:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority` | Production |
| `MONGODB_DB_NAME` | `satkhirar-amm`                                                                                  | Production |
| `JWT_SECRET`      | (Generate 32+ char random string)                                                                | Production |
| `NODE_ENV`        | `production`                                                                                     | Production |
| `CLIENT_ORIGINS`  | `https://website.vercel.app,https://dashboard.vercel.app`                                        | Production |
| `ADMIN_EMAIL`     | `admin@example.com`                                                                              | Production |
| `ADMIN_PASSWORD`  | `strong-password-here`                                                                           | Production |

**⚠️ IMPORTANT**: Replace placeholders with your actual values!

## 🧪 Step 6: Test Connection Locally

```bash
cd Satkhirar-Amm---backend

# Make sure MONGODB_URI is in your local .env file
npm run dev

# Test health endpoint
curl http://localhost:5000/health/db
```

Expected response:

```json
{
  "ok": true,
  "database": "connected"
}
```

## ✅ Step 7: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "feat: configure mongodb for vercel deployment"

# Push to main branch (Vercel auto-deploys)
git push origin main

# Check deployment status at:
# https://vercel.com/dashboard/satkhirar-amm-backend
```

## 🔍 Verify Production Deployment

After deployment completes:

```bash
# Test production API
node scripts/testAPI.js https://your-api.vercel.app

# Or manually test health endpoint
curl https://your-api.vercel.app/health/db
```

## ⚠️ Common Issues & Fixes

### Issue: Connection Timeout

```
MongoServerSelectionError: getaddrinfo ENOTFOUND cluster0.xxxxx.mongodb.net
```

**Fix**: Add `0.0.0.0/0` to MongoDB Atlas Network Access

### Issue: Authentication Failed

```
MongoAuthenticationError: Authentication failed
```

**Fix**: Check password is correct in MONGODB_URI

### Issue: Database Does Not Exist

```
MongoError: namespace not found
```

**Fix**: Create database first (Step 4 above)

### Issue: Cannot Connect from Vercel but Can from Local

**Fix**: This is a network access issue

- Check IP whitelist in MongoDB Atlas
- Add `0.0.0.0/0` if not already there
- Wait 5-10 minutes for changes to take effect

## 📊 Monitoring Connections

To see active connections in MongoDB Atlas:

1. Go to **Metrics** (left sidebar)
2. Look for **Network Connections** graph
3. Should see connections from Vercel when deployed

## 🔐 Security Best Practices

1. **Use strong passwords** - Click "Autogenerate Secure Password"
2. **Limit IP whitelist** - Use specific IPs instead of 0.0.0.0/0 for production
3. **Rotate passwords** - Change database user password every 3 months
4. **Use different databases** - Separate development and production databases
5. **Enable audit logs** - Go to Project Settings → Audit Logs

## 📞 Useful Links

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Atlas Network Access](https://docs.atlas.mongodb.com/security-whitelist/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [MongoDB Connection String](https://docs.atlas.mongodb.com/driver-connection/)

---

**That's it!** Your MongoDB Atlas should now be connected to Vercel.
