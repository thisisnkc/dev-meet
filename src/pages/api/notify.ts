import { NextApiResponse } from "next";
import { NextApiRequest } from "next";
import { pusherServer } from "@/lib/pusher-server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const { userId, notification } = req.body;
  if (!userId || !notification) {
    return res.status(400).json({ message: "Missing userId or notification" });
  }

  await pusherServer.trigger(userId, "notification", notification);

  return res.status(200).json({ sent: true });
}
