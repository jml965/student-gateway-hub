import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    return nodemailer.createTransport(smtpUrl);
  }
  return null;
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  draft: { ar: "مسودة", en: "Draft" },
  submitted: { ar: "مقدَّم", en: "Submitted" },
  documents_pending: { ar: "وثائق ناقصة", en: "Documents Pending" },
  under_review: { ar: "قيد المراجعة", en: "Under Review" },
  sent_to_university: { ar: "تم الإرسال للجامعة", en: "Sent to University" },
  preliminary_accepted: { ar: "قبول مبدئي 🎉", en: "Preliminary Accepted 🎉" },
  accepted: { ar: "مقبول ✅", en: "Accepted ✅" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  withdrawn: { ar: "مسحوب", en: "Withdrawn" },
};

export async function sendApplicationStatusEmail(params: {
  studentName: string;
  studentEmail: string;
  uniNameEn: string;
  uniNameAr: string;
  specNameEn: string;
  specNameAr: string;
  newStatus: string;
  notes?: string | null;
}): Promise<void> {
  const transport = createTransport();
  const { studentName, studentEmail, uniNameEn, uniNameAr, specNameEn, specNameAr, newStatus, notes } = params;
  const statusEn = STATUS_LABELS[newStatus]?.en ?? newStatus;
  const statusAr = STATUS_LABELS[newStatus]?.ar ?? newStatus;
  const isPreliminary = newStatus === "preliminary_accepted";
  const isRejected = newStatus === "rejected";

  const subject = `Baansy: Application Update — ${statusEn}`;

  if (!transport) {
    logger.info(
      { to: studentEmail, subject, newStatus },
      "SMTP_URL not configured — application status email not delivered. Set SMTP_URL to enable email delivery."
    );
    return;
  }

  const notesHtml = notes
    ? `<div style="background:#f0f9ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:6px;margin:16px 0"><strong>Advisor Note:</strong> ${notes}</div>`
    : "";
  const notesHtmlAr = notes
    ? `<div style="background:#f0f9ff;border-right:4px solid #2563eb;padding:12px 16px;border-radius:6px;margin:16px 0"><strong>ملاحظة المشرف:</strong> ${notes}</div>`
    : "";

  const accentColor = isPreliminary ? "#10b981" : isRejected ? "#ef4444" : "#2563eb";

  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? "noreply@baansy.com",
    to: studentEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
          <h2 style="color:#fff;margin:0">Baansy</h2>
          <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:13px">Smart University Registration Platform</p>
        </div>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your application to <strong>${uniNameEn}</strong> — ${specNameEn} has been updated.</p>
        <div style="background:${accentColor}15;border:2px solid ${accentColor};border-radius:10px;padding:16px;text-align:center;margin:20px 0">
          <p style="font-size:20px;font-weight:700;color:${accentColor};margin:0">${statusEn}</p>
          ${isPreliminary ? '<p style="color:#065f46;margin:8px 0 0">Congratulations! Your application has been preliminarily accepted. Please proceed to the payment step.</p>' : ""}
        </div>
        ${notesHtml}
        ${isPreliminary
          ? `<div style="text-align:center;margin:20px 0"><a href="https://baansy.replit.app" style="background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">Continue to Payment →</a></div>`
          : `<div style="text-align:center;margin:20px 0"><a href="https://baansy.replit.app" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">Track My Application</a></div>`
        }
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <div dir="rtl">
          <p>عزيزي <strong>${studentName}</strong>،</p>
          <p>تم تحديث حالة طلبك في <strong>${uniNameAr}</strong> — ${specNameAr}.</p>
          <div style="background:${accentColor}15;border:2px solid ${accentColor};border-radius:10px;padding:16px;text-align:center">
            <p style="font-size:20px;font-weight:700;color:${accentColor};margin:0">${statusAr}</p>
            ${isPreliminary ? '<p style="color:#065f46;margin:8px 0 0">مبروك! تم قبول طلبك مبدئياً. يرجى المتابعة لخطوة الدفع.</p>' : ""}
          </div>
          ${notesHtmlAr}
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px">Baansy — منصة التسجيل الجامعي الذكية</p>
      </div>
    `,
  });
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
