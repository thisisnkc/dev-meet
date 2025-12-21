import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️ REDIS_URL not set, using localhost (development only)");
}

export const redis = new Redis(redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
  // Increase timeout for serverless environments
  connectTimeout: 10000,
  // TLS configuration for secure connections (Upstash, etc.)
  ...(redisUrl?.includes("rediss://") && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("ready", () => {
  console.log("✅ Redis ready to accept commands");
});
