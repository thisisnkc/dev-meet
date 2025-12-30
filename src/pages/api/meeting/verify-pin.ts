import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { parseISO, subMinutes, addMinutes } from "date-fns";
import { redis } from "@/lib/redis";
import { MeetingStatus } from "@/utlis/constants";

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
      return res.status(400).json({
        status: MeetingStatus.INVALID_PIN,
        message: "Invalid PIN format",
      });
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
      return res.status(404).json({
        status: MeetingStatus.INVALID_MEETING,
        message: "Meeting not found",
      });
    }

    if (booking.attendees.length === 0) {
      return res
        .status(401)
        .json({ status: MeetingStatus.INVALID_PIN, message: "Invalid PIN" });
    }

    // Time Validation
    const now = new Date();
    const meetingStartDateTime = parseISO(
      `${booking.date.toISOString().split("T")[0]}T${booking.from}`
    );
    const meetingEndDateTime = parseISO(
      `${booking.date.toISOString().split("T")[0]}T${booking.to}`
    );

    // Allow joining 30 minutes before start
    const allowedJoinTime = subMinutes(meetingStartDateTime, 30);
    // Allow joining up to 30 minutes after end
    const allowedEndTime = addMinutes(meetingEndDateTime, 30);

    if (now < allowedJoinTime) {
      return res.status(403).json({
        status: MeetingStatus.TOO_EARLY,
        message: "Meeting has not started yet.",
        startTime: meetingStartDateTime.toISOString(),
      });
    }

    if (now > allowedEndTime) {
      return res.status(403).json({
        status: MeetingStatus.TOO_LATE,
        message: "Meeting has ended.",
      });
    }

    // Host Presence Check
    const isHostActive = await redis.get(`meeting:${meetingId}:host_active`);

    if (!isHostActive) {
      return res.status(200).json({
        status: MeetingStatus.WAITING_FOR_HOST,
        message: "Waiting for host to join...",
        startTime: meetingStartDateTime.toISOString(),
      });
    }

    // Success - Guest joins anonymously but with identity
    const attendeeEmail = booking.attendees[0].email;
    return res
      .status(200)
      .json({ status: MeetingStatus.VALID, valid: true, email: attendeeEmail });
  } catch (error) {
    console.error("PIN Verification Error:", error);
    return res
      .status(500)
      .json({ status: MeetingStatus.ERROR, message: "Internal server error" });
  }
}
