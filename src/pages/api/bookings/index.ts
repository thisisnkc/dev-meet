import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { genRandomMeetingId, genSixDigitOtp } from "@/utlis/constants";
import { notificationQueue } from "@/queue/notificationQueue";
import moment from "moment-timezone";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "POST") {
      const { title, date, from, to, description, attendeeEmails } = req.body;

      const userId = req.headers["x-user-id"] as string;

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          email: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!userId || !title || !date || !from || !to) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const existing = await prisma.booking.findFirst({
        where: {
          title,
          date: new Date(date),
          from,
          to,
          organizerId: userId,
        },
      });

      if (existing) {
        return res.status(409).json({ message: "Booking already exists." });
      }
      const meetingId = genRandomMeetingId();

      const meetingPin = genSixDigitOtp();

      const booking = await prisma.booking.create({
        data: {
          title,
          date: new Date(date),
          from,
          to,
          meetingId,
          meetingPin,
          description,
          organizerId: userId,
          attendees: {
            create: attendeeEmails.map((email: string) => ({
              email,
            })),
          },
        },
        include: {
          attendees: true,
        },
      });

      const scheduledDateTime = moment.tz(`${date}T${from}`, "Asia/Kolkata");
      const notifyAt = scheduledDateTime.clone().subtract(10, "minutes");
      const delay = Math.max(notifyAt.diff(moment()), 0);

      if (delay > 0) {
        await notificationQueue.add(
          "notify-user",
          {
            userId,
            title,
            date,
            from,
            to,
          },
          {
            delay,
            attempts: 3,
            removeOnComplete: true,
          }
        );
      }

      // await sendMeetingInvites({
      //   title,
      //   date,
      //   from,
      //   to,
      //   description,
      //   organizerEmail: user.email,
      //   attendees: attendeeEmails,
      //   meetingId,
      //   meetingPin,
      // });

      return res.status(201).json({ message: "Booking created", booking });
    }

    if (req.method === "GET") {
      const userId = req.query.userId as string;
      const date = req.query.date as string | undefined;

      if (!userId) {
        return res.status(400).json({ message: "Missing userId in query" });
      }

      const whereClause: any = {
        organizerId: userId,
        ...(date && {
          date: {
            gte: new Date(date),
            lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
          },
        }),
      };

      const meetings = await prisma.booking.findMany({
        where: whereClause,
        orderBy: {
          date: "asc",
        },
        include: {
          attendees: true,
        },
      });

      return res.status(200).json({ meetings });
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (error) {
    console.error("[MEETINGS_API]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
