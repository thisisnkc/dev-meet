import React, { createContext, useContext, useEffect } from "react";
import Pusher from "pusher-js";
import { pusherClient } from "@/lib/pusher";

interface PusherContextValue {
  pusherClient: Pusher;
}

const PusherContext = createContext<PusherContextValue>({
  pusherClient,
});

export const PusherProvider: React.FC<{
  userId: string | null;
  children: React.ReactNode;
}> = ({ userId, children }) => {
  useEffect(() => {
    if (userId) {
      pusherClient.subscribe(userId);
      console.log(`Subscribed to user channel: ${userId}`);
    }

    return () => {
      if (userId) {
        pusherClient.unsubscribe(userId);
        console.log(`Unsubscribed from user channel: ${userId}`);
      }
    };
  }, [userId]);

  return (
    <PusherContext.Provider value={{ pusherClient }}>
      {children}
    </PusherContext.Provider>
  );
};

export function usePusherContext() {
  return useContext(PusherContext);
}
