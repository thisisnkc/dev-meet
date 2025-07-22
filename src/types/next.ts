import type { NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Server as IOServer } from "socket.io";
import { Socket } from "net";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io: IOServer;
    };
  };
};
