import Bull from "bull";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const notificationQueue = new Bull("meeting-notifications", redisUrl, {
  redis: {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    connectTimeout: 30000,
    family: 0, // Auto-detect IPv4/IPv6
    keepAlive: 30000,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    // TLS for secure connections (Upstash)
    ...(redisUrl.includes("rediss://") && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
