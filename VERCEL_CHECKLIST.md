# Vercel Deployment Checklist ✅

Before pushing to Vercel, complete these steps:

## 1. Local Testing

- [ ] Run `npm run build` - verify no syntax errors
- [ ] Run `npm run dev` - API starts on http://localhost:5000
- [ ] Test health endpoint: `http://localhost:5000/health`
- [ ] Test database health: `http://localhost:5000/health/db`
- [ ] Test API endpoint: `http://localhost:5000/api/products`

## 2. Environment Variables Setup

### MongoDB Atlas Configuration

- [ ] Go to MongoDB Atlas Dashboard
- [ ] **Network Access**: Add IP whitelist
  - Option A: Add `0.0.0.0/0` (for testing/staging)
  - Option B: Add Vercel IP ranges (for production):
    - 76.75.14.0/24
    - 98.198.198.0/24
    - 34.212.75.0/24
- [ ] **Database Access**: Create user for Vercel (if not exists)
- [ ] **Connection String**: Copy MongoDB URI

### Vercel Dashboard Setup

1. Go to your project settings
2. Set Root Directory to `Satkhirar-Amm---backend` if you deploy from the combined parent repo; leave it empty if this backend is its own repo
3. Go to "Environment Variables"
4. Add ALL these variables for **Production**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=satkhirar-amm
   MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
   MONGODB_CONNECT_TIMEOUT_MS=5000
   MONGODB_QUERY_TIMEOUT_MS=8000
   JWT_SECRET=your-32-char-secret-key
   CLIENT_ORIGINS=https://your-website.vercel.app,https://your-dashboard.vercel.app
   ALLOW_VERCEL_PREVIEWS=true
   ADMIN_EMAIL=your-email@example.com
   ADMIN_PASSWORD=strong-password
   ```

## 3. Code Quality Checks

- [ ] No console.log statements left in critical paths
- [ ] Error messages are user-friendly
- [ ] No hardcoded credentials or secrets
- [ ] All routes properly error handled

## 4. Deployment

```bash
# Commit changes
git add .
git commit -m "fix: improve vercel error handling and deployment"

# Push to repository
git push origin main

# Vercel auto-deploys on push to main
# Monitor: https://vercel.com/dashboard/your-project
```

## 5. Post-Deployment Verification

- [ ] Check Vercel deployment logs for errors
- [ ] Visit `https://your-api.vercel.app/health`
- [ ] Visit `https://your-api.vercel.app/health/db`
- [ ] Test from dashboard/website with real API URL

## Common Issues & Fixes

### Issue: "ENOTFOUND mongodb.net"

**Solution**: Whitelist 0.0.0.0/0 in MongoDB Atlas Network Access

### Issue: "unauthorized: auth failed"

**Solution**: Check MONGODB_URI credentials are correct

### Issue: "Function Timeout"

**Solution**: Increase `maxDuration` in vercel.json (max 900s)

### Issue: "Malformed JSON"

**Solution**: Ensure client sends proper JSON with `Content-Type: application/json`

## Environment Variables Reference

| Variable              | Value                          | Required |
| --------------------- | ------------------------------ | -------- |
| MONGODB_URI           | Your MongoDB connection string | ✅       |
| MONGODB_DB_NAME       | satkhirar-amm                  | ✅       |
| JWT_SECRET            | Min 32 characters              | ✅       |
| NODE_ENV              | production                     | ✅       |
| CLIENT_ORIGINS        | Your frontend URLs             | ✅       |
| ADMIN_EMAIL           | Admin email                    | ✅       |
| ADMIN_PASSWORD        | Admin password                 | ✅       |
| ALLOW_VERCEL_PREVIEWS | true                           | ❌       |
| SKIP_DATABASE_SEED    | false                          | ❌       |
