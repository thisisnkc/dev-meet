import { NextApiResponseServerIO } from "@/types/next";
import { NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const { userId, notification } = req.body;
  if (!userId || !notification) {
    return res.status(400).json({ message: "Missing userId or notification" });
  }
  if (!res.socket.server.io) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Server } = require("socket.io");
    res.socket.server.io = new Server(res.socket.server, {
      path: "/api/socketio",
      cors: { origin: "*" },
    });
    res.socket.server.io.to(userId).emit("notification", notification);
  } else {
    res.socket.server.io.to(userId).emit("notification", notification);
  }
  return res.status(200).json({ sent: true });
}
