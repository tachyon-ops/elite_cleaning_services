import nodemailer from "nodemailer";

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailPayload) {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return { success: true, messageId: "test-mock-id" };
  }

  const clean = (val: string | undefined) => (val || "").trim().replace(/^["']|["']$/g, "");

  const host = clean(process.env.SMTP_HOST);
  const port = Number(clean(process.env.SMTP_PORT || "587"));
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS);
  const from = clean(process.env.SMTP_FROM) || `"Mondar Specialty Cleaning" <${user}>`;

  if (!host || !user || !pass) {
    console.warn("[SMTP WARNING] SMTP configuration is incomplete. Skipping mail dispatch.");
    return { success: false, error: "SMTP configuration is incomplete" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "")
    });

    console.log(`[SMTP SUCCESS] Message dispatched to ${to}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[SMTP FAILURE] Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}
