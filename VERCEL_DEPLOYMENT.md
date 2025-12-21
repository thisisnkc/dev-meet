# Vercel Deployment Guide for DevMeet

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **PostgreSQL Database** (Required)

   - Recommended: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Railway](https://railway.app/)
   - Get your `DATABASE_URL` connection string

2. **Redis Instance** (Required for Bull Queue)
   - Recommended: [Upstash Redis](https://upstash.com/) (free tier available)
   - Get your `REDIS_URL` connection string

## Step 1: Prepare Your Database

### Option A: Using Neon (Recommended)

1. Go to [neon.tech](https://neon.tech/) and create a free account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:pass@host.neon.tech/dbname`)
4. This will be your `DATABASE_URL`

### Option B: Using Supabase

1. Go to [supabase.com](https://supabase.com/) and create a project
2. Go to Settings → Database
3. Copy the "Connection string" under "Connection pooling"
4. This will be your `DATABASE_URL`

## Step 2: Set Up Redis

### Using Upstash (Recommended for Vercel)

1. Go to [upstash.com](https://upstash.com/) and create an account
2. Create a new Redis database
3. Copy the connection string (format: `redis://default:password@host.upstash.io:port`)
4. This will be your `REDIS_URL`

## Step 3: Run Database Migrations

**IMPORTANT:** Run migrations BEFORE deploying to Vercel.

```bash
# Set your DATABASE_URL environment variable
export DATABASE_URL="your-database-url-here"

# Run migrations
npx prisma migrate deploy

# Or if you need to reset and seed
npx prisma migrate reset
```

## Step 4: Configure Vercel Environment Variables

In your Vercel project settings, add these environment variables:

### Required Variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname

# Redis (for Bull Queue)
REDIS_URL=redis://default:password@host.upstash.io:port

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Jitsi Meet Configuration
MEET_SECRET=your-jitsi-secret-key
NEXT_PUBLIC_MEET_DOMAIN=meet.jit.si

# Application URL
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Node Environment
NODE_ENV=production
```

### Optional Variables:

```env
# Email configuration (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Step 5: Deploy to Vercel

### Method 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Method 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com/)
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Build Command:** `npm run build:prod`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
5. Add all environment variables from Step 4
6. Click "Deploy"

## Step 6: Post-Deployment

### Verify Deployment

1. Check that the app loads at your Vercel URL
2. Test user registration and login
3. Create a test meeting
4. Verify Socket.IO connection in browser console
5. Check that notifications work

### Monitor Logs

```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

## Common Issues & Solutions

### Issue 1: "Prisma Client not generated"

**Solution:** The `postinstall` script should handle this, but if it fails:

```bash
# In Vercel build settings, set build command to:
prisma generate && next build
```

### Issue 2: "Can't reach database server"

**Solution:**

- Verify `DATABASE_URL` is correct in Vercel environment variables
- Ensure your database allows connections from Vercel's IP ranges
- For Neon/Supabase, this should work automatically

### Issue 3: "Redis connection failed"

**Solution:**

- Verify `REDIS_URL` is correct
- Ensure Upstash Redis is accessible (it should be by default)
- Check Upstash dashboard for connection issues

### Issue 4: "Module not found" errors

**Solution:**

- Clear Vercel build cache: Settings → General → Clear Build Cache
- Redeploy

### Issue 5: Database migrations not applied

**Solution:**

- Run migrations manually before deployment:
  ```bash
  DATABASE_URL="your-prod-db-url" npx prisma migrate deploy
  ```
- Consider using Vercel's [Deploy Hooks](https://vercel.com/docs/deployments/deploy-hooks) to run migrations

## Database Migration Strategy

### For Production Deployments:

1. **Before deploying code changes with schema changes:**

   ```bash
   # Connect to production database
   DATABASE_URL="your-prod-db-url" npx prisma migrate deploy
   ```

2. **For new deployments:**

   - Migrations should already be applied (see Step 3)
   - Vercel build will only generate Prisma Client, not run migrations

3. **Automated approach (Advanced):**
   Create a GitHub Action or use Vercel's build hooks to run migrations automatically.

## Performance Optimization

### Enable Edge Runtime (Optional)

For better performance, consider enabling Edge Runtime for API routes:

```typescript
// In your API routes
export const config = {
  runtime: "edge",
};
```

**Note:** Bull Queue won't work with Edge Runtime. Keep worker initialization in Node.js runtime.

### Database Connection Pooling

Use connection pooling for better performance:

- Neon: Use the pooled connection string
- Supabase: Enable "Connection pooling" in settings

## Monitoring

### Recommended Tools:

1. **Vercel Analytics** - Built-in performance monitoring
2. **Sentry** - Error tracking
3. **LogRocket** - Session replay and debugging

## Security Checklist

- [ ] All environment variables are set in Vercel (not in code)
- [ ] `JWT_SECRET` is a strong random string
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled for API routes
- [ ] Input validation is in place

## Scaling Considerations

### When your app grows:

1. **Database:** Upgrade to a paid tier with more connections
2. **Redis:** Upgrade Upstash for more memory/throughput
3. **Vercel:** Consider Pro plan for better performance
4. **Background Jobs:** Consider moving to a dedicated worker service (e.g., Railway, Render)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for client-side errors
3. Verify all environment variables are set correctly
4. Ensure database migrations are applied

## Quick Deploy Checklist

- [ ] Database created and `DATABASE_URL` obtained
- [ ] Redis instance created and `REDIS_URL` obtained
- [ ] Migrations run on production database
- [ ] All environment variables added to Vercel
- [ ] Code pushed to Git repository
- [ ] Vercel project connected to repository
- [ ] Build command set to `npm run build:prod`
- [ ] Deployment successful
- [ ] App tested and working

---

**Ready to deploy!** 🚀

For more help, see:

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
