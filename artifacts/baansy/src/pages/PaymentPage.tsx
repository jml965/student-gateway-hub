import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Lang = "ar" | "en";
type Theme = "light" | "dark";
interface Props { lang: Lang; theme: Theme; navigate: (p: string) => void; }

interface AppInfo {
  id: number; status: string;
  tuitionFee: string | null; currency: string;
  specNameEn: string; specNameAr: string;
  uniNameEn: string; uniNameAr: string;
  universityId: number;
  paymentMode: "direct" | "platform";
  bankIban: string | null; bankName: string | null;
  bankBeneficiary: string | null; bankBranch: string | null;
  bankInstructionsAr: string | null; bankInstructionsEn: string | null;
}

interface PaymentRecord {
  id: number; status: string; channel: string;
  amount: string; currency: string;
  stripeSessionId: string | null; receiptUrl: string | null;
  createdAt: string;
}

export default function PaymentPage({ lang, theme, navigate }: Props) {
  const { user } = useAuth();
  const isAr = lang === "ar";
  const isDark = theme === "dark";
  const font = isAr ? "'Cairo','Inter',sans-serif" : "'Inter','Cairo',sans-serif";

  const bg = isDark ? "#0d1117" : "#f8faff";
  const card = isDark ? "#161b22" : "#ffffff";
  const textMain = isDark ? "#e6edf3" : "#0f172a";
  const textMuted = isDark ? "#8b949e" : "#64748b";
  const border = isDark ? "#30363d" : "#e2e8f0";
  const inputBg = isDark ? "#0d1117" : "#f8fafc";

  const [apps, setApps] = useState<{ id: number; status: string; uniNameEn: string; uniNameAr: string; specNameEn: string; specNameAr: string }[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [info, setInfo] = useState<{ app: AppInfo; payment: PaymentRecord | null; publishableKey: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get("success");
    const cancelParam = params.get("cancel");
    const appIdParam = params.get("appId");

    if (successParam === "1") {
      setSuccess(isAr ? "تم الدفع بنجاح! سيتم مراجعة طلبك وتأكيد القبول النهائي." : "Payment successful! Your application will be reviewed for final acceptance.");
    }
    if (cancelParam === "1") {
      setError(isAr ? "تم إلغاء عملية الدفع." : "Payment was cancelled.");
    }
    if (appIdParam) setSelectedAppId(parseInt(appIdParam));

    loadApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) loadInfo(selectedAppId);
  }, [selectedAppId]);

  const loadApps = async () => {
    try {
      const data = await api.get<any[]>("/applications");
      const payable = data.filter(a => ["preliminary_accepted", "payment_pending"].includes(a.status));
      setApps(payable);
      if (payable.length === 1 && !selectedAppId) setSelectedAppId(payable[0].id);
    } catch { /* ignore */ }
  };

  const loadInfo = async (appId: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<typeof info>(`/payments/info/${appId}`);
      setInfo(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load payment info");
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!selectedAppId) return;
    setStripeLoading(true);
    setError("");
    try {
      const res = await api.post<{ sessionUrl: string }>("/payments/stripe/create-session", { applicationId: selectedAppId });
      window.location.href = res.sessionUrl;
    } catch (e: any) {
      setError(e.message ?? "Failed to create payment session");
      setStripeLoading(false);
    }
  };

  const handleBankInitiate = async () => {
    if (!selectedAppId) return;
    setBankLoading(true);
    setError("");
    try {
      await api.post<any>("/payments/bank/initiate", { applicationId: selectedAppId });
      setSuccess(isAr ? "تم تسجيل طلب التحويل البنكي. يرجى إرسال الحوالة وانتظار التأكيد." : "Bank transfer request registered. Please send the transfer and wait for confirmation.");
      await loadInfo(selectedAppId);
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally {
      setBankLoading(false);
    }
  };

  const handleReceiptUpload = async () => {
    if (!info?.payment?.id || !receiptUrl.trim()) return;
    setReceiptLoading(true);
    setError("");
    try {
      await api.post<any>("/payments/bank/upload-receipt", { paymentId: info.payment.id, receiptUrl: receiptUrl.trim() });
      setSuccess(isAr ? "تم رفع إيصال التحويل. سيتم مراجعته وتأكيد الدفع قريباً." : "Transfer receipt submitted. Admin will review and confirm your payment shortly.");
      setReceiptUrl("");
      if (selectedAppId) await loadInfo(selectedAppId);
    } catch (e: any) {
      setError(e.message ?? "Failed to upload receipt");
    } finally {
      setReceiptLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: font, color: textMain, background: bg }}>
        <button onClick={() => navigate("login")} style={{ padding: "12px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>
          {isAr ? "تسجيل الدخول" : "Login"}
        </button>
      </div>
    );
  }

  const amount = info?.app?.tuitionFee ? parseFloat(info.app.tuitionFee) : null;
  const currency = info?.app?.currency ?? "USD";
  const paymentMode = info?.app?.paymentMode ?? "platform";
  const paymentStatus = info?.payment?.status;
  const reference = selectedAppId ? `BAANSY-${String(selectedAppId).padStart(6, "0")}` : "";

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: font, direction: isAr ? "rtl" : "ltr" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate("applications")} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 14px", color: textMuted, cursor: "pointer", fontSize: 13, fontFamily: font }}>
            {isAr ? "← العودة" : "← Back"}
          </button>
          <div style={{ fontSize: 22, fontWeight: 800, color: textMain }}>💳 {isAr ? "بوابة الدفع" : "Payment Portal"}</div>
        </div>

        {/* Alerts */}
        {success && (
          <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#065f46", fontWeight: 600 }}>
            ✅ {success}
          </div>
        )}
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#991b1b" }}>
            ⚠️ {error}
          </div>
        )}

        {/* App selector if multiple payable apps */}
        {apps.length > 1 && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 10 }}>{isAr ? "اختر الطلب" : "Select Application"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {apps.map(a => (
                <button key={a.id} onClick={() => setSelectedAppId(a.id)}
                  style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${selectedAppId === a.id ? "#2563eb" : border}`, background: selectedAppId === a.id ? (isDark ? "#1e3a5f" : "#eff6ff") : inputBg, color: textMain, cursor: "pointer", fontFamily: font, textAlign: isAr ? "right" : "left", fontSize: 14, fontWeight: selectedAppId === a.id ? 700 : 400 }}>
                  {isAr ? a.uniNameAr : a.uniNameEn} — {isAr ? a.specNameAr : a.specNameEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {apps.length === 0 && !loading && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 40, textAlign: "center", color: textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: textMain, marginBottom: 8 }}>{isAr ? "لا توجد طلبات تتطلب دفعاً" : "No applications pending payment"}</div>
            <div style={{ fontSize: 13 }}>{isAr ? "ستظهر هنا طلباتك بعد الحصول على القبول المبدئي." : "Applications with preliminary acceptance will appear here."}</div>
            <button onClick={() => navigate("applications")} style={{ marginTop: 16, background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: font }}>
              {isAr ? "عرض طلباتي" : "View Applications"}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
        )}

        {info && !loading && (
          <>
            {/* Application summary */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {isAr ? "تفاصيل الطلب" : "Application Details"}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: textMain }}>{isAr ? info.app.uniNameAr : info.app.uniNameEn}</div>
              <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>{isAr ? info.app.specNameAr : info.app.specNameEn}</div>
              {amount !== null && (
                <div style={{ marginTop: 14, padding: "14px 20px", background: isDark ? "#1e293b" : "#f0f9ff", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: textMuted }}>{isAr ? "المبلغ المطلوب" : "Amount Due"}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#2563eb" }}>{amount.toLocaleString()} {currency}</span>
                </div>
              )}
              {reference && (
                <div style={{ marginTop: 10, fontSize: 12, color: textMuted }}>
                  {isAr ? "رقم المرجع: " : "Reference: "}<strong style={{ fontFamily: "monospace", color: textMain }}>{reference}</strong>
                </div>
              )}
            </div>

            {/* Payment status if already initiated */}
            {info.payment && (
              <div style={{ background: card, border: `2px solid ${paymentStatus === "confirmed" ? "#10b981" : paymentStatus === "failed" ? "#ef4444" : "#f59e0b"}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: paymentStatus === "confirmed" ? "#059669" : paymentStatus === "failed" ? "#dc2626" : "#d97706" }}>
                  {paymentStatus === "confirmed" ? (isAr ? "✅ تم تأكيد الدفع" : "✅ Payment Confirmed")
                    : paymentStatus === "failed" ? (isAr ? "❌ فشل الدفع" : "❌ Payment Failed")
                    : (isAr ? "⏳ في انتظار التأكيد" : "⏳ Awaiting Confirmation")}
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>
                  {info.payment.channel === "bank" ? (isAr ? "قناة الدفع: تحويل بنكي" : "Channel: Bank Transfer")
                    : (isAr ? "قناة الدفع: بطاقة إلكترونية" : "Channel: Card (Stripe)")}
                </div>
                {/* Receipt upload for pending bank payments */}
                {info.payment.channel === "bank" && info.payment.status === "pending" && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${border}`, paddingTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textMain, marginBottom: 8 }}>
                      {isAr ? "📎 رفع إيصال التحويل" : "📎 Upload Transfer Receipt"}
                    </div>
                    <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
                      {isAr
                        ? "بعد إتمام التحويل، يرجى رفع صورة الإيصال أو إدخال رابطه لتسريع عملية التأكيد."
                        : "After completing the transfer, submit a link to your receipt image to help us confirm faster."}
                    </div>
                    {info.payment.receiptUrl ? (
                      <div style={{ fontSize: 12, color: "#059669", background: "#d1fae5", borderRadius: 8, padding: "8px 12px" }}>
                        ✅ {isAr ? "تم رفع الإيصال" : "Receipt submitted"}: <a href={info.payment.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#059669" }}>{isAr ? "عرض" : "View"}</a>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="url"
                          placeholder={isAr ? "رابط صورة الإيصال (https://...)" : "Receipt image URL (https://...)"}
                          value={receiptUrl}
                          onChange={e => setReceiptUrl(e.target.value)}
                          style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font }}
                        />
                        <button
                          onClick={handleReceiptUpload}
                          disabled={receiptLoading || !receiptUrl.trim()}
                          style={{ padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: receiptLoading || !receiptUrl.trim() ? "not-allowed" : "pointer", fontFamily: font, opacity: receiptLoading || !receiptUrl.trim() ? 0.6 : 1 }}
                        >
                          {receiptLoading ? "..." : (isAr ? "رفع" : "Submit")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {info.payment.status === "confirmed" && (
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: "#059669" }}>
                    {isAr ? "🎉 تم قبولك نهائياً في الجامعة!" : "🎉 You are now fully accepted!"}
                  </div>
                )}
              </div>
            )}

            {/* Payment options */}
            {(!info.payment || info.payment.status === "failed") && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: textMain, marginBottom: 18 }}>
                  {isAr ? "اختر طريقة الدفع" : "Choose Payment Method"}
                </div>

                {/* Platform / Stripe */}
                {paymentMode === "platform" && (
                  <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 24 }}>💳</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: textMain }}>{isAr ? "الدفع بالبطاقة (Visa / Mastercard)" : "Card Payment (Visa / Mastercard)"}</div>
                        <div style={{ fontSize: 12, color: textMuted }}>{isAr ? "آمن وسريع — إيصال فوري" : "Secure & instant — instant receipt"}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleStripeCheckout}
                      disabled={stripeLoading}
                      style={{ width: "100%", padding: "14px 0", background: stripeLoading ? "#6366f1" : "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: stripeLoading ? "not-allowed" : "pointer", fontFamily: font, opacity: stripeLoading ? 0.8 : 1 }}
                    >
                      {stripeLoading ? (isAr ? "جاري التوجيه..." : "Redirecting...") : (isAr ? "الدفع الآن ←" : "Pay Now →")}
                    </button>
                  </div>
                )}

                {/* Bank / Direct */}
                {paymentMode === "direct" && (
                  <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 24 }}>🏦</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: textMain }}>{isAr ? "تحويل بنكي مباشر" : "Direct Bank Transfer"}</div>
                        <div style={{ fontSize: 12, color: textMuted }}>{isAr ? "حوّل المبلغ مباشرة لحساب الجامعة" : "Transfer directly to the university account"}</div>
                      </div>
                    </div>

                    <div style={{ background: isDark ? "#1e293b" : "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      {info.app.bankBeneficiary && <BankRow label={isAr ? "المستفيد" : "Beneficiary"} value={info.app.bankBeneficiary} />}
                      {info.app.bankName && <BankRow label={isAr ? "البنك" : "Bank"} value={info.app.bankName} />}
                      {info.app.bankIban && <BankRow label="IBAN" value={info.app.bankIban} mono />}
                      {info.app.bankBranch && <BankRow label={isAr ? "الفرع" : "Branch"} value={info.app.bankBranch} />}
                      <BankRow label={isAr ? "المبلغ" : "Amount"} value={`${amount?.toLocaleString() ?? "—"} ${currency}`} />
                      <BankRow label={isAr ? "المرجع" : "Reference"} value={reference} mono />
                    </div>

                    {(isAr ? info.app.bankInstructionsAr : info.app.bankInstructionsEn) && (
                      <div style={{ fontSize: 12, color: textMuted, background: isDark ? "#1e293b" : "#fffbeb", border: `1px solid ${isDark ? "#334155" : "#fcd34d"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                        {isAr ? info.app.bankInstructionsAr : info.app.bankInstructionsEn}
                      </div>
                    )}

                    <button
                      onClick={handleBankInitiate}
                      disabled={bankLoading || info.payment?.status === "pending"}
                      style={{ width: "100%", padding: "13px 0", background: (bankLoading || info.payment?.status === "pending") ? "#94a3b8" : "#0891b2", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (bankLoading || info.payment?.status === "pending") ? "not-allowed" : "pointer", fontFamily: font }}
                    >
                      {info.payment?.status === "pending"
                        ? (isAr ? "⏳ في انتظار تأكيد التحويل..." : "⏳ Awaiting transfer confirmation...")
                        : bankLoading
                          ? (isAr ? "جاري التسجيل..." : "Registering...")
                          : (isAr ? "لقد أجريت التحويل — تسجيل الطلب" : "I've transferred — Register Request")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BankRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: mono ? "monospace" : "inherit", color: "#0f172a" }}>{value}</span>
        <button onClick={copy} title="Copy" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 2 }}>
          {copied ? "✅" : "📋"}
        </button>
      </div>
    </div>
  );
}
