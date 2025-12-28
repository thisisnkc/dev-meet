import nodemailer from "nodemailer";
import { createEvent } from "ics";

interface MeetingInviteDetails {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  organizerEmail: string;
  meetingId: string;
  meetingPin: number;
  attendees: string[];
}

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendMeetingInvites({
    title,
    date,
    startTime,
    endTime,
    description,
    organizerEmail,
    meetingId,
    meetingPin,
    attendees,
  }: MeetingInviteDetails) {
    console.log("🚀 ~ EmailService ~ sendMeetingInvites ~ starting");

    // Check for missing credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn(
        "⚠️ Missing GMAIL_USER or GMAIL_PASS in environment variables. Email sending may fail."
      );
    }

    const meetingLink =
      (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") +
      "/meeting/" +
      meetingId;
    const formattedDate = new Date(date).toDateString();

    const emailHtml = `
      <h2>📅 You've been invited to a meeting!</h2>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
      <p><strong>Organizer:</strong> ${organizerEmail}</p>
      <p><strong>Meeting PIN:</strong> ${meetingPin}</p>
      ${
        description ? `<p><strong>Description:</strong> ${description}</p>` : ""
      }
      <p><strong>Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
      <p>ℹ️ To join the meeting, please click the link above and enter the PIN when prompted.</p>
    `;

    const [year, month, day] = date.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const eventDuration =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);

    const { error, value: icsContent } = await new Promise<{
      error: Error | undefined;
      value: string | undefined;
    }>((resolve) => {
      createEvent(
        {
          start: [year, month, day, startHour, startMinute],
          duration: { minutes: eventDuration },
          title: title,
          description: description,
          location: meetingLink,
          url: meetingLink,
          organizer: { name: "DevMeet", email: organizerEmail },
          attendees: attendees.map((email) => ({ name: email, email })),
          status: "CONFIRMED",
          busyStatus: "BUSY",
        },
        (error, value) => {
          resolve({ error, value });
        }
      );
    });

    if (error || !icsContent) {
      console.error("❌ Failed to generate ICS:", error);
    }

    const responses = await Promise.allSettled(
      attendees.map((email) =>
        this.transporter.sendMail({
          from: `"DevMeet" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: `Invitation: "${title}"`,
          html: emailHtml,
          icalEvent: icsContent
            ? {
                filename: "invite.ics",
                method: "request",
                content: icsContent,
              }
            : undefined,
        })
      )
    );

    responses.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `❌ Failed to send email to ${attendees[index]}:`,
          result.reason
        );
      } else {
        console.log(
          `✅ Email sent to ${attendees[index]}:`,
          result.value.messageId
        );
      }
    });

    return responses;
  }
}

/**
 * Sends calendar invitation emails to attendees
 * Uses the EmailService singleton.
 */
export async function sendMeetingInvites(details: MeetingInviteDetails) {
  const emailService = EmailService.getInstance();
  return emailService.sendMeetingInvites(details);
}
