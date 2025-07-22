import Bull from "bull";

export const notificationQueue = new Bull(
  "meeting-notifications",
  process.env.REDIS_URL || "redis://localhost:6379"
);
