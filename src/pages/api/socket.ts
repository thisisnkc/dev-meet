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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socketio",
      transports: ["websocket"],
      addTrailingSlash: false,
      cors: {
        origin: "*",
      },
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { setIO } = require("@/lib/socket-store");
      setIO(io);
    } catch {
      // ignore
    }

    io.on("connection", (socket) => {
      debugLogger("Client connected", socket.id);

      socket.on("join", (userId: string) => {
        socket.join(userId);
        debugLogger(`User ${userId} joined room`);
      });

      socket.on("disconnect", () => {
        debugLogger("Client disconnected", socket.id);
      });

      socket.on("host-join", async (meetingId: string) => {
        socket.join(meetingId);

        // Update host status in DB
        try {
          // Since we can't easily import prisma client here if it wasn't already (Next.js context),
          // we better rely on the global prisma if available or dynamic import?
          // The file already imports redis at top level, so importing prisma at top level is fine.
          // Wait, I need to add the import first.

          // Using strict import from lib/prisma
          const { prisma } = await import("@/lib/prisma");

          await prisma.booking.update({
            where: { meetingId },
            data: { hostJoined: true },
          });
        } catch (e) {
          debugLogger("Error updating host status", e);
        }

        socket.emit("host-joined", meetingId);
        debugLogger(`Host joined meeting ${meetingId}`);
      });

      socket.on("attendee-join", (meetingId: string) => {
        socket.join(meetingId);
        debugLogger(`Attendee joined meeting ${meetingId}`);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
