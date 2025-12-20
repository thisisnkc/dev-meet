import { Server as SocketIOServer } from "socket.io";

// Define a type for the global object to avoid TS errors
declare global {
  // eslint-disable-next-line no-var
  var __socket_io: SocketIOServer | undefined;
}

export const setIO = (serverIO: SocketIOServer) => {
  global.__socket_io = serverIO;
  console.log("✅ [SocketStore] Socket.IO instance set globally");
};

export const getIO = () => {
  if (!global.__socket_io) {
    console.warn(
      "⚠️ [SocketStore] getIO called but global.__socket_io is undefined"
    );
  }
  return global.__socket_io;
};
