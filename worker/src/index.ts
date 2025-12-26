import { initializeNotificationWorker } from "./workers/notificationWorker";

console.log("🚀 Starting DevMeet Notification Worker Service...");
console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
console.log(
  `🔗 Redis URL: ${process.env.REDIS_URL ? "✓ Configured" : "✗ Missing"}`
);
console.log(
  `🗄️  Database URL: ${process.env.DATABASE_URL ? "✓ Configured" : "✗ Missing"}`
);
console.log(
  `🌐 API Base URL: ${
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  }`
);

// Initialize the worker
initializeNotificationWorker();

console.log("✅ Worker service started successfully");
