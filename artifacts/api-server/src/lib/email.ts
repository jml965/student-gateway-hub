import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    return nodemailer.createTransport(smtpUrl);
  }
  return null;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    logger.warn({ to }, "SMTP_URL not configured — password reset email not delivered. Set SMTP_URL to enable email delivery.");
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || "noreply@baansy.com",
    to,
    subject: "Baansy — إعادة تعيين كلمة المرور / Reset Your Password",
    html: `
      <div dir="rtl" style="font-family:Cairo,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8faff;border-radius:16px;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <h2 style="color:#fff;margin:0;font-size:22px;">Baansy</h2>
          <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">منصة التسجيل الجامعي الذكية</p>
        </div>
        <p style="color:#1e293b;font-size:15px;">مرحباً،</p>
        <p style="color:#475569;font-size:14px;line-height:1.7;">
          تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط على الزر أدناه لإتمام العملية.
          <br>يصلح الرابط لمدة ساعة واحدة فقط.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetUrl}" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;display:inline-block;">
            إعادة تعيين كلمة المرور
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;">
          إذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان.
        </p>
      </div>
    `,
  });
}
