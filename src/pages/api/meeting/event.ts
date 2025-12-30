import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { pusherServer } from "@/lib/pusher-server";
import { MeetingEvent } from "@/utlis/constants";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { meetingId, event } = req.body;

    if (!meetingId || !event) {
      return res
        .status(400)
        .json({ message: "Meeting ID and event are required" });
    }

    // Verify the user is the organizer of this meeting
    const booking = await prisma.booking.findUnique({
      where: {
        meetingId: meetingId,
      },
      select: {
        organizerId: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (booking.organizerId !== user.id) {
      return res
        .status(403)
        .json({ message: "Only the host can activate/manage the meeting" });
    }

    if (event === MeetingEvent.HOST_JOINED) {
      // Set Host Active in Redis (2 hours TTL)
      await redis.set(`meeting:${meetingId}:host_active`, "true", "EX", 7200);

      // Trigger Pusher Event
      await pusherServer.trigger(
        `meeting-${meetingId}`,
        MeetingEvent.HOST_JOINED,
        {
          started: true,
        }
      );
    } else if (event === MeetingEvent.HOST_LEFT) {
      console.log("Host left event received");
      // Remove Host Active status
      await redis.del(`meeting:${meetingId}:host_active`);

      // Trigger Pusher Event
      await pusherServer.trigger(
        `meeting-${meetingId}`,
        MeetingEvent.HOST_LEFT,
        {
          ended: true,
        }
      );
    } else {
      return res.status(400).json({ message: "Invalid event type" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Event API Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
