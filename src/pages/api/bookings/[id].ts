import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing booking ID" });
  }

  try {
    // 1. Check if booking exists and belongs to user
    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { organizerId: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (existing.organizerId !== userId) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to delete this booking",
      });
    }

    const deletedBooking = await prisma.$transaction(async (tx) => {
      await tx.attendee.deleteMany({
        where: { bookingId: id },
      });

      return await tx.booking.delete({
        where: { id },
      });
    });

    return res
      .status(200)
      .json({ message: "Booking deleted", booking: deletedBooking });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ message: "Failed to delete booking" });
  }
}
