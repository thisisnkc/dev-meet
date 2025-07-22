import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

let globalSocket: Socket | null = null;

export const SocketProvider: React.FC<{
  userId: string | null;
  children: React.ReactNode;
}> = ({ userId, children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!globalSocket) {
      fetch("/api/socket").then(() => {
        globalSocket = io({
          path: "/api/socketio",
          transports: ["websocket"],
        });
        setSocket(globalSocket);
      });
    } else {
      setSocket(globalSocket);
    }
    return () => {
      // ** Do not disconnect here, keep socket alive for the app lifetime */
    };
  }, []);

  useEffect(() => {
    if (socket && userId && !joinedRef.current) {
      socket.emit("join", userId);
      joinedRef.current = true;
    }
  }, [socket, userId]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocketContext() {
  return useContext(SocketContext);
}
