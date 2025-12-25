import { NextApiRequest, NextApiResponse } from "next";
import { redis } from "@/lib/redis";
import debug from "debug";
// import { pusherServer } from "@/lib/pusher-server"; // Uncomment if you want to broadcast joining

const debugLogger = debug("devmeet:server");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { meetingId, userId, role } = req.body;

  if (!meetingId || !userId || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    if (role === "host") {
      await redis.set(`meeting:${meetingId}:host`, userId, "EX", 60 * 60 * 24);
      debugLogger(`Host joined meeting ${meetingId}`);
    } else {
      await redis.set(
        `meeting:${meetingId}:attendee`,
        userId,
        "EX",
        60 * 60 * 24
      );
      debugLogger(`Attendee joined meeting ${meetingId}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
