import { notificationQueue } from "../notificationQueue";
import { prisma } from "@/lib/prisma";
import axios from "axios";

let isWorkerInitialized = false;

/**
 * Initialize the notification worker to process queued jobs
 * This should be called once when the application starts
 */
export function initializeNotificationWorker() {
  // Prevent multiple initializations
  if (isWorkerInitialized) {
    console.log("⚠️ Notification worker already initialized");
    return;
  }

  console.log("🚀 Initializing notification worker...");

  notificationQueue.process("notify-user", async (job, done) => {
    try {
      const { userId, title, from, meetingId } = job.data;

      console.log(
        `📧 Processing notification for user ${userId} - Meeting: ${title}`
      );

      // Verify meeting still exists before notifying
      // This "handles perfectly" the case where a meeting was deleted but the job remained in the queue
      const existingBooking = await prisma.booking.findFirst({
        where: {
          meetingId: meetingId, // Using the unique meeting code/ID
          organizerId: userId,
        },
      });

      if (!existingBooking) {
        console.log(
          `⚠️ Meeting ${meetingId} no longer exists. Skipping notification.`
        );
        done();
        return;
      }

      // Save notification to DB
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: "Upcoming Meeting",
          description: `Your meeting "${title}" starts at ${from}`,
        },
      });

      // Send notification to main server for socket emission
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        await axios.post(`${baseUrl}/api/notify`, {
          userId,
          notification: {
            id: notification.id,
            title: notification.title,
            description: notification.description,
            meetingId,
            createdAt: notification.createdAt,
            read: notification.read,
          },
        });
        console.log(`✅ Notification sent successfully for user ${userId}`);
      } catch (notifyErr) {
        console.error(
          "❌ Error sending notification via /api/notify",
          notifyErr
        );
      }

      done();
    } catch (error) {
      console.error("❌ Error processing notification job", error);
      done(error as Error);
    }
  });

  // Handle worker events
  notificationQueue.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  notificationQueue.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  notificationQueue.on("error", (error) => {
    console.error("❌ Queue error:", error);
  });

  isWorkerInitialized = true;
  console.log("✅ Notification worker initialized successfully");
}

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  const cleanup = async () => {
    console.log("🛑 Shutting down notification worker...");
    await notificationQueue.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
