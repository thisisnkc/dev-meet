// pages/api/socket.ts
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/next";
import debug from "debug";
import { redis } from "@/lib/redis";
import { initializeNotificationWorker } from "@/queue/workers/notificationWorker";

export const config = {
  api: {
    bodyParser: false,
  },
};

const debugLogger = debug("devmeet:server");

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    debugLogger("🔌 Initializing Socket.io");

    const httpServer = res.socket.server as NetServer;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socketio",
      transports: ["websocket"],
      addTrailingSlash: false,
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      debugLogger("Client connected", socket.id);

      socket.on("join", (userId: string) => {
        socket.join(userId);
        debugLogger(`User ${userId} joined room`);
      });

      socket.on("disconnect", () => {
        debugLogger("Client disconnected", socket.id);
      });

      socket.on("host-join", (meetingId: string, userId: string) => {
        socket.join(meetingId);

        redis.set(`meeting:${meetingId}:host`, userId, "EX", 60 * 60 * 24);

        socket.emit("host-joined", meetingId);
        debugLogger(`Host joined meeting ${meetingId}`);
      });

      socket.on("attendee-join", (meetingId: string, userId: string) => {
        socket.join(meetingId);

        redis.set(`meeting:${meetingId}:attendee`, userId, "EX", 60 * 60 * 24);

        debugLogger(`Attendee joined meeting ${meetingId}`);
      });
    });

    res.socket.server.io = io;

    // Initialize notification worker when server starts
    initializeNotificationWorker();
  }

  res.end();
}
