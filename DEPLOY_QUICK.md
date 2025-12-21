# Quick Vercel Deployment Steps

## 🚀 Fast Track (5 minutes)

### 1. Database Setup (Choose one)

**Neon (Recommended):**

```bash
# 1. Go to https://neon.tech
# 2. Create project → Copy connection string
# 3. Set as DATABASE_URL
```

**Supabase:**

```bash
# 1. Go to https://supabase.com
# 2. Create project → Settings → Database → Copy pooled connection
# 3. Set as DATABASE_URL
```

### 2. Redis Setup

**Upstash:**

```bash
# 1. Go to https://upstash.com
# 2. Create Redis database → Copy connection string
# 3. Set as REDIS_URL
```

### 3. Run Migrations

```bash
# Replace with your actual DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname"
npx prisma migrate deploy
```

### 4. Deploy to Vercel

```bash
# Option A: CLI
npm i -g vercel
vercel login
vercel --prod

# Option B: Dashboard
# Go to vercel.com → Import Git Repo → Add env vars → Deploy
```

### 5. Required Environment Variables

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=random-secret-string-here
MEET_SECRET=jitsi-secret-key
NEXT_PUBLIC_MEET_DOMAIN=meet.jit.si
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NODE_ENV=production
```

## ⚠️ Important Notes

1. **Migrations MUST be run before deployment** - Don't skip step 3!
2. **Build command is now:** `npm run build:prod` (migrations removed)
3. **Prisma generates automatically** via `postinstall` script
4. **Worker runs with the app** - No separate worker process needed

## 🐛 Quick Troubleshooting

| Error                         | Fix                                   |
| ----------------------------- | ------------------------------------- |
| "Prisma Client not generated" | Redeploy (postinstall will run)       |
| "Can't reach database"        | Check DATABASE_URL in Vercel env vars |
| "Redis connection failed"     | Check REDIS_URL format                |
| "Build failed"                | Check build logs in Vercel dashboard  |

## ✅ Verify Deployment

After deployment:

- [ ] App loads at Vercel URL
- [ ] Can register/login
- [ ] Can create meetings
- [ ] Notifications work
- [ ] Socket.IO connects (check browser console)

---

**Need more details?** See `VERCEL_DEPLOYMENT.md`
