export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeNotificationWorker } = await import(
      "@/queue/workers/notificationWorker"
    );
    initializeNotificationWorker();
  }
}
