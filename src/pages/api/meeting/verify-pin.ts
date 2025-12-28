import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { parseISO, subMinutes } from "date-fns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { meetingId, pin } = req.body;

  if (!meetingId || !pin) {
    return res.status(400).json({ message: "Meeting ID and PIN are required" });
  }

  try {
    const pinNumber = parseInt(pin as string, 10);

    if (isNaN(pinNumber)) {
      return res.status(400).json({ message: "Invalid PIN format" });
    }

    const booking = await prisma.booking.findUnique({
      where: {
        meetingId: meetingId,
      },
      include: {
        attendees: {
          where: {
            meetingPin: pinNumber,
          },
          take: 1,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (booking.attendees.length === 0) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // Time Validation
    const now = new Date();
    const meetingStartDateTime = parseISO(
      `${booking.date.toISOString().split("T")[0]}T${booking.from}`
    );
    const meetingEndDateTime = parseISO(
      `${booking.date.toISOString().split("T")[0]}T${booking.to}`
    );

    // Allow joining 15 minutes before start
    const allowedJoinTime = subMinutes(meetingStartDateTime, 15);

    if (now < allowedJoinTime) {
      return res.status(403).json({
        message: "Meeting has not started yet. You can join 15 minutes early.",
      });
    }

    if (now > meetingEndDateTime) {
      return res
        .status(403)
        .json({ message: "Meeting has ended. You can no longer join." });
    }

    // Success - No token generated, guest joins anonymously
    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error("PIN Verification Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
