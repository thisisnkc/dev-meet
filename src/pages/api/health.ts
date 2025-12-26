import { NextApiRequest, NextApiResponse } from "next";
// Worker initialization removed - now runs as standalone service
// import { initializeNotificationWorker } from "@/queue/workers/notificationWorker";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({
    status: "ok",
    message: "API is healthy. Worker runs as standalone service.",
    timestamp: new Date().toISOString(),
  });
}
