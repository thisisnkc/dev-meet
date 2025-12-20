import { prisma } from "../../lib/prisma";
import { notificationQueue } from "../notificationQueue";

export const initNotificationWorker = () => {
  console.log("Starting notification worker...");
  notificationQueue.process("notify-user", async (job: any, done: any) => {
    try {
      const { userId, title, from, meetingId } = job.data;

      // Save notification to DB
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: "Upcoming Meeting",
          description: `Your meeting "${title}" starts at ${from}`,
        },
      });

      // Send notification via socket
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getIO } = require("../../lib/socket-store");
        const io = getIO();

        if (io) {
          io.to(userId).emit("notification", {
            id: notification.id,
            title: notification.title,
            description: notification.description,
            meetingId,
            createdAt: notification.createdAt,
            read: notification.read,
          });
          console.log(`[Queue] Notification sent to ${userId}`);
        } else {
          // Fallback to axios if io is not ready (which shouldn't happen if site is visited)
          // Or we just assume if nobody is connected, no socket needed.
          // But let's keep axios as retry fallback just in case we are on different ports (dev mode edge case)
          // Actually, axios fails on port mismatch.
          console.warn(
            "[Queue] Socket IO not ready, skipping socket emission (notification saved to DB)"
          );
        }
      } catch (notifyErr) {
        console.error("❌ Error sending notification", notifyErr);
      }

      done();
    } catch (error) {
      console.error("❌ Error saving notification", error);
      done(error);
    }
  });
};

if (require.main === module) {
  initNotificationWorker();
}
