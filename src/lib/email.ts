// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// /**
//  * Sends calendar invitation emails to attendees
//  */
// export async function sendMeetingInvites({
//   title,
//   date,
//   from,
//   to,
//   description,
//   organizerEmail,
//   attendees,
//   meetingId,
// }: {
//   title: string;
//   date: string;
//   from: string;
//   to: string;
//   description?: string;
//   organizerEmail: string;
//   meetingId: string;
//   meetingPin: number;
//   attendees: string[];
// }) {
//   console.log("🚀 ~ attendees:", attendees);
//   console.log("🚀 ~ meetingLink:", meetingId);
//   console.log("🚀 ~ organizerEmail:", organizerEmail);
//   console.log("🚀 ~ description:", description);
//   console.log("🚀 ~ to:", to);
//   console.log("🚀 ~ from:", from);
//   console.log("🚀 ~ date:", date);
//   console.log("🚀 ~ title:", title);

//   const meetingLink = "http://localhost:3000/meeting/" + meetingId;
//   const formattedDate = new Date(date).toDateString();

//   console.log("🚀 ~ formattedDate:", formattedDate);

//   const emailHtml = `
//     <h2>📅 You've been invited to a meeting!</h2>
//     <p><strong>Title:</strong> ${title}</p>
//     <p><strong>Date:</strong> ${formattedDate}</p>
//     <p><strong>Time:</strong> ${from} - ${to}</p>
//     <p><strong>Organizer:</strong> ${organizerEmail}</p>
//     ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
//     <p><strong>Organizer:</strong> ${meetingLink}</p>
//     <p>Please mark your calendar.</p>
//   `;

//   const responses = await Promise.allSettled(
//     attendees.map((email) =>
//       resend.emails.send({
//         from: "onboarding@resend.dev",
//         to: email,
//         subject: `You're invited to "${title}"`,
//         html: emailHtml,
//       })
//     )
//   );
//   console.log("🚀 ~ responses:", responses[0]?.value.error);
//   console.log("🚀 ~ responses[0]:", responses[0]);

//   return responses;
// }
