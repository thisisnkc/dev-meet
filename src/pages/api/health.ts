import { NextApiRequest, NextApiResponse } from "next";
import { initializeNotificationWorker } from "@/queue/workers/notificationWorker";

// Initialize worker on first API call
let initialized = false;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!initialized) {
    initializeNotificationWorker();
    initialized = true;
  }

  return res.status(200).json({
    status: "ok",
    worker: "initialized",
    timestamp: new Date().toISOString(),
  });
}
