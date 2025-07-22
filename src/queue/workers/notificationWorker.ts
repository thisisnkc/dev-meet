// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { notificationQueue } = require("../notificationQueue");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const axios = require("axios");

const prisma = new PrismaClient();

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

    // Send notification to main server for socket emission
    try {
      await axios.post("http://localhost:3000/api/notify", {
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
    } catch (notifyErr) {
      console.error("❌ Error sending notification via /api/notify", notifyErr);
    }

    done();
  } catch (error) {
    console.error("❌ Error saving notification", error);
    done(error);
  }
});
