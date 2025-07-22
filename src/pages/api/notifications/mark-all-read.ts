import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "Missing userId" });

  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return res.status(200).json({ message: "Marked all as read" });
  } catch {
    return res.status(500).json({ message: "Something went wrong" });
  }
}
