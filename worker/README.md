# DevMeet Notification Worker

This is a standalone worker service that processes notification jobs from the Bull queue. It runs independently from the Next.js application and is designed to be deployed on platforms that support long-running Node.js processes.

## Architecture

The worker service:

- Connects to the same Redis instance as your Next.js app
- Processes jobs from the `meeting-notifications` queue
- Queries the database to verify meetings still exist
- Creates notifications in the database
- Sends HTTP requests to your Next.js app's `/api/notify` endpoint to trigger real-time notifications via Pusher

## Local Development

### Prerequisites

- Node.js 18+
- Access to the same PostgreSQL database as your Next.js app
- Access to the same Redis instance as your Next.js app

### Setup

1. Install dependencies:

```bash
cd worker
npm install
```

2. Copy environment variables:

```bash
cp env.example .env
```

3. Configure your `.env` file with the correct values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/devmeet"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

4. Generate Prisma Client:

```bash
npx prisma generate
```

5. Run the worker:

```bash
npm run dev
```

## Production Deployment

### Using Docker

1. Build the Docker image:

```bash
docker build -t devmeet-worker .
```

2. Run the container:

```bash
docker run -d \
  --name devmeet-worker \
  -e DATABASE_URL="your-database-url" \
  -e REDIS_URL="your-redis-url" \
  -e NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app" \
  -e NODE_ENV="production" \
  devmeet-worker
```

### Deployment Platforms

#### Render

1. Create a new "Background Worker" service
2. Connect your repository
3. Set the Docker context to `./worker`
4. Add environment variables
5. Deploy

#### Railway

1. Create a new project
2. Add a service from your repository
3. Set the root directory to `worker`
4. Add environment variables
5. Deploy

#### Heroku

1. Create a new app
2. Set buildpacks to use Docker
3. Add environment variables
4. Deploy using Git

#### DigitalOcean App Platform

1. Create a new app
2. Select "Worker" as the component type
3. Set the Dockerfile path to `worker/Dockerfile`
4. Add environment variables
5. Deploy

## Environment Variables

| Variable               | Description                                             | Example                               |
| ---------------------- | ------------------------------------------------------- | ------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                            | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL`            | Redis connection string (supports TLS with `rediss://`) | `redis://localhost:6379`              |
| `NEXT_PUBLIC_BASE_URL` | Your Next.js app URL                                    | `https://your-app.vercel.app`         |
| `NODE_ENV`             | Environment mode                                        | `production`                          |

## Monitoring

The worker logs all activities to stdout:

- `🚀` Worker initialization
- `📧` Job processing
- `✅` Successful completions
- `❌` Errors and failures
- `⚠️` Warnings (e.g., meeting no longer exists)

## Graceful Shutdown

The worker handles `SIGINT` and `SIGTERM` signals gracefully:

1. Stops accepting new jobs
2. Waits for current jobs to complete
3. Closes Redis connection
4. Disconnects from database
5. Exits cleanly

## Troubleshooting

### Worker not processing jobs

- Verify Redis connection (check `REDIS_URL`)
- Ensure the Next.js app is adding jobs to the queue
- Check Redis keys: `bull:meeting-notifications:*`

### Database connection errors

- Verify `DATABASE_URL` is correct
- Ensure the database is accessible from the worker's network
- Check Prisma Client is generated (`npx prisma generate`)

### Notifications not appearing in app

- Verify `NEXT_PUBLIC_BASE_URL` points to your Next.js app
- Check the `/api/notify` endpoint is accessible
- Ensure Pusher credentials are configured in your Next.js app
