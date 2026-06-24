"use server";

import { sendEmail } from "@/lib/email-utils";
import { db } from "@/lib/db";

export async function submitContactForm(formData: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  // Validate basic inputs
  if (!formData.name || !formData.email || !formData.subject || !formData.message) {
    return { success: false, error: "Missing required fields" };
  }

  // Double-check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return { success: false, error: "Invalid email address" };
  }

  try {
    // Get recipient email (contact_email setting)
    const emailRes = await db.systemSetting.findUnique({ where: { key: "contact_email" } });
    const recipientEmail = emailRes?.value || "ops@elite-cleaning.ch";

    // Build the email body
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #0f172a;">
        <h2 style="font-size: 20px; font-weight: bold; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-top: 0; color: #0f172a;">
          New Contact Form Submission
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 120px; color: #475569;">Name:</td>
            <td style="padding: 6px 0; color: #0f172a;">${formData.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 6px 0; color: #0f172a;"><a href="mailto:${formData.email}" style="color: #d4af37; text-decoration: underline;">${formData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">Phone:</td>
            <td style="padding: 6px 0; color: #0f172a;">${formData.phone || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">Subject:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${formData.subject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 6px; border: 1px solid #edf2f7;">
          <p style="margin: 0; font-weight: bold; color: #475569; margin-bottom: 8px;">Message:</p>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #0f172a;">${formData.message}</p>
        </div>
        <p style="margin-top: 25px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          Sent from Mondar Website Contact Form
        </p>
      </div>
    `;

    // Send the email
    const sendResult = await sendEmail({
      to: recipientEmail,
      subject: `[Contact Form] ${formData.subject}`,
      html,
    });

    if (sendResult.success) {
      return { success: true };
    } else {
      return { success: false, error: sendResult.error || "Failed to dispatch email." };
    }
  } catch (error: any) {
    console.error("Error in submitContactForm Server Action:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
