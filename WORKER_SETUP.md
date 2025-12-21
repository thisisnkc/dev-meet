# Notification Worker Setup

## Overview

The notification worker has been integrated to run automatically with the Next.js application, making it suitable for Vercel deployment without requiring a separate worker process or Docker container.

## How It Works

### 1. Worker Initialization

- The worker is initialized when the Socket.IO server starts (in `/api/socket.ts`)
- This ensures the worker starts automatically when the app receives its first request
- The worker uses a singleton pattern to prevent multiple initializations

### 2. Queue Processing

- Uses Bull queue with Redis for job management
- Processes `notify-user` jobs to send meeting notifications
- Jobs are scheduled with delays to notify users before meetings start

### 3. Environment Variables Required

Make sure these are set in your `.env` file and Vercel environment variables:

```env
# Redis connection (required for Bull queue)
REDIS_URL=redis://your-redis-host:6379

# Base URL for API callbacks
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

## Vercel Deployment Considerations

### Redis Requirement

You'll need a Redis instance. Recommended options:

- **Upstash Redis** (recommended for Vercel): https://upstash.com/
- **Redis Cloud**: https://redis.com/cloud/
- **Railway**: https://railway.app/

### Setting Up Upstash Redis (Recommended)

1. Go to https://upstash.com/ and create a free account
2. Create a new Redis database
3. Copy the `REDIS_URL` connection string
4. Add it to your Vercel environment variables

### Important Notes

- The worker runs in the same process as your Next.js app
- Vercel serverless functions have a 10-second timeout for Hobby plan, 60 seconds for Pro
- Long-running jobs should complete within these limits
- For production, consider using Vercel's cron jobs for scheduled tasks

## Testing Locally

1. Make sure Redis is running locally or use a cloud Redis instance
2. Start the development server:
   ```bash
   npm run dev
   ```
3. The worker will initialize automatically when you visit the app
4. Check the console for: `✅ Notification worker initialized successfully`

## Monitoring

The worker logs important events:

- `🚀 Initializing notification worker...` - Worker starting
- `✅ Notification worker initialized successfully` - Worker ready
- `📧 Processing notification for user...` - Job being processed
- `✅ Job completed` - Job finished successfully
- `❌ Job failed` - Job encountered an error

## Files Modified

1. `/src/queue/workers/notificationWorker.ts` - Refactored as initializable module
2. `/src/pages/api/socket.ts` - Added worker initialization
3. `/src/pages/api/health.ts` - Health check endpoint (optional)

## Alternative: Vercel Cron Jobs

For more reliable scheduled tasks in production, consider using Vercel Cron Jobs:
https://vercel.com/docs/cron-jobs

This would require refactoring the notification system to use scheduled API routes instead of Bull queue.
