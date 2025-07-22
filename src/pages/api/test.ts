// // pages/api/test-mail.ts

// import type { NextApiRequest, NextApiResponse } from "next";
// import { MailtrapClient } from "mailtrap";

// const TOKEN = process.env.MAILTRAP_TOKEN!;
// const SENDER_EMAIL = "noreply@demomailtrap.co"; // Can be any placeholder
// const SENDER_NAME = "DevMeet";

// const client = new MailtrapClient({ token: TOKEN });

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method not allowed. Use POST." });
//   }

//   const { email } = req.body;

//   if (!email || typeof email !== "string") {
//     return res
//       .status(400)
//       .json({ message: "Invalid or missing email address." });
//   }

//   try {
//     const response = await client.send({
//       from: {
//         email: SENDER_EMAIL,
//         name: SENDER_NAME,
//       },
//       to: [{ email }],
//       subject: "Test Email from DevMeet",
//       html: `
//         <h1>Hello from DevMeet 👋</h1>
//         <p>This is a test email sent via Mailtrap API.</p>
//         <p>If you're reading this, Mailtrap integration is working correctly ✅</p>
//       `,
//     });
//     console.log("🚀 ~ response:", response);

//     return res
//       .status(200)
//       .json({ message: "Test email sent successfully", response });
//   } catch (err: any) {
//     console.error("❌ Mailtrap send failed:", err);
//     return res
//       .status(500)
//       .json({ message: "Failed to send test email", error: err.message });
//   }
// }
