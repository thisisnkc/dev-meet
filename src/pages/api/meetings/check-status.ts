import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { redis } from "@/lib/redis";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return checkMeetingStatus(req, res);
  } else if (req.method === "POST") {
    return checkMeetingWithPin(req, res);
  }

  return res.status(405).json({ message: "Method not allowed" });
}

const checkMeetingStatus = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { meetingId, attendeeId } = req.query;

    if (
      !meetingId ||
      typeof meetingId !== "string" ||
      !attendeeId ||
      typeof attendeeId !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Missing or invalid meeting ID or attendee ID" });
    }

    const isMeetingExist = await prisma.booking.findFirst({
      where: {
        meetingId: meetingId,
        attendees: {
          some: {
            id: attendeeId,
          },
        },
      },
    });
    console.log("🚀 ~ isMeetingExist:", isMeetingExist);

    if (!isMeetingExist) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const hasHostJoined = await redis.get(`meeting:${meetingId}:host`);

    if (hasHostJoined) {
      return res.status(200).json({ message: "Host has joined" });
    }

    return res.status(404).json({ message: "Host has not joined" });
  } catch (error) {
    console.error("[UPDATE_USER]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const checkMeetingWithPin = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { meetingPin } = req.body;
  console.log("🚀 ~ meetingPin:", meetingPin);

  if (
    !meetingPin ||
    typeof meetingPin !== "string" ||
    meetingPin.toString().length !== 6
  ) {
    return res.status(400).json({ message: "Missing or invalid meeting pin" });
  }

  const meeting = await prisma.booking.findFirst({
    where: {
      attendees: {
        some: {
          meetingPin: Number(meetingPin),
        },
      },
    },
    select: {
      meetingId: true,
      attendees: {
        select: {
          id: true,
        },
      },
    },
  });
  console.log("🚀 ~ meeting:", meeting);

  if (!meeting) {
    return res.status(404).json({ message: "Meeting not found" });
  }

  return res.status(200).json({
    result: {
      meetingId: meeting.meetingId,
      attendeeId: meeting.attendees[0].id,
    },
  });
};
