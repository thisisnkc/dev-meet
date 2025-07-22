// pages/api/socket.ts
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/next";
import debug from "debug";

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

    const httpServer: NetServer = res.socket.server as any;
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
    });

    res.socket.server.io = io;
  }

  res.end();
}
