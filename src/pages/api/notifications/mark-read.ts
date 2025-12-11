import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ message: "Missing notificationId" });
  }

  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark notification as read" });
  }
}
