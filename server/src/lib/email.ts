import nodemailer from "nodemailer";
import { logger } from "./logger";

// Configuration from environment
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "Global College <noreply@globalcollege.edu.pk>";

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  logger.info(`Email transporter configured: ${SMTP_HOST}`);
} else {
  logger.warn("Email transporter NOT configured. Emails will be logged to console only.");
}

export async function sendEmail({ to, subject, html, text }: { to: string, subject: string, html?: string, text?: string }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  } else {
    logger.info("--- MOCK EMAIL ---");
    logger.info(`To: ${to}`);
    logger.info(`Subject: ${subject}`);
    logger.info(`Body: ${text || html}`);
    logger.info("------------------");
    return { mock: true };
  }
}

// Templates
export const emailTemplates = {
  verification: (name: string, url: string) => ({
    subject: "Verify your email - Global College",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
        <h1 style="color: #2563eb;">Welcome to Global College!</h1>
        <p>Hello ${name},</p>
        <p>Thank you for joining our community. To complete your registration, please verify your email address by clicking the button below:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Verify Email Address</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px;">${url}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Global College of Emerging Technologies. If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
    text: `Welcome to Global College, ${name}! Please verify your email by visiting: ${url}`
  }),
  
  passwordReset: (name: string, url: string) => ({
    subject: "Reset your password - Global College",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>Otherwise, click the button below to set a new password:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">${url}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Global College of Emerging Technologies.</p>
      </div>
    `,
    text: `Hello ${name}, reset your password here: ${url}`
  })
};
