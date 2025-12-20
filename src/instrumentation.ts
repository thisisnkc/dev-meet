export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initNotificationWorker } = await import(
      "./queue/workers/notificationWorker"
    );
    initNotificationWorker();
  }
}
