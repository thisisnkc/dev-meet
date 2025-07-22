import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ notifications });
  } catch {
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
}
