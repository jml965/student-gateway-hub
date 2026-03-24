import { useState, useEffect } from "react";
import { Star, Users, GraduationCap, ArrL, ArrR } from "@/components/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

interface ReferralItem {
  id: number;
  commissionRate: string;
  commissionAmount: string | null;
  paymentStatus: string;
  paidAmount: string;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  studentId: number | null;
  studentName: string | null;
  studentEmail: string | null;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referrals: ReferralItem[];
  summary: {
    totalReferrals: number;
    totalCommission: string;
    totalPaid: string;
    totalUnpaid: string;
  };
}

const T = {
  ar: {
    dir: "rtl" as const, font: "'Cairo','Inter',sans-serif",
    back: "العودة",
    title: "بوابة المحيل",
    subtitle: "تتبع إحالاتك وعمولاتك",
    myCode: "كود الإحالة الخاص بك",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ!",
    totalReferrals: "إجمالي الإحالات",
    totalCommission: "إجمالي العمولات",
    totalPaid: "المحصّل",
    totalUnpaid: "المتبقي",
    referrals: "الإحالات",
    noReferrals: "لا توجد إحالات بعد",
    noReferralsHint: "شارك رابطك مع الطلاب لبدء كسب العمولات",
    student: "الطالب",
    commission: "العمولة",
    paid: "المدفوع",
    status: "الحالة",
    date: "التاريخ",
    statusPaid: "مدفوعة",
    statusPartial: "جزئي",
    statusUnpaid: "غير مدفوعة",
    loading: "جاري التحميل...",
    loginRequired: "يرجى تسجيل الدخول للوصول إلى لوحة المحيل",
    loginBtn: "تسجيل الدخول",
    paymentHistory: "سجل الدفعات",
    rate: "نسبة العمولة",
    notes: "ملاحظات",
    shareLink: "رابط الإحالة",
    tagline: "منصة التسجيل الجامعي الذكية",

    refName: "محمد العجمي", refHandle: "@m_alaajmi",
    refQuote: "اخترت Baansy لأنها الأفضل في تسجيل الجامعات — سهّلت رحلة دراستي في الخارج من اليوم الأول!",
    refCta: "ابدأ رحلتك الآن", refSubCta: "مجاناً • بدون رسوم تسجيل",
    refBadges: ["تسجيل جامعي", "سكن طلابي", "فيزا بالضمان", "استقبال مطار"],
    refStat1V: "19,000+", refStat1L: "جامعة حول العالم",
    refStat2V: "50,000+", refStat2L: "طالب مسجّل",
    refStat3V: "10+", refStat3L: "سنوات خبرة",
    refWTop: "رحّب بك", refMain: "بوابتك للدراسة في الخارج",
    refSub: "منصة Baansy تجمع أكثر من 19,000 جامعة حول العالم في مكان واحد",
  },
  en: {
    dir: "ltr" as const, font: "'Inter','Cairo',sans-serif",
    back: "Back",
    title: "Referrer Dashboard",
    subtitle: "Track your referrals and commissions",
    myCode: "Your Referral Code",
    copyLink: "Copy Link",
    copied: "Copied!",
    totalReferrals: "Total Referrals",
    totalCommission: "Total Commission",
    totalPaid: "Paid",
    totalUnpaid: "Remaining",
    referrals: "Referrals",
    noReferrals: "No referrals yet",
    noReferralsHint: "Share your link with students to start earning commissions",
    student: "Student",
    commission: "Commission",
    paid: "Paid",
    status: "Status",
    date: "Date",
    statusPaid: "Paid",
    statusPartial: "Partial",
    statusUnpaid: "Unpaid",
    loading: "Loading...",
    loginRequired: "Please log in to access the referrer dashboard",
    loginBtn: "Log In",
    paymentHistory: "Payment History",
    rate: "Rate",
    notes: "Notes",
    shareLink: "Referral Link",
    tagline: "Smart University Registration Platform",

    refName: "Mohammed Al-Ajmi", refHandle: "@m_alaajmi",
    refQuote: "I chose Baansy because they're the best for university registration — they made my study abroad journey so easy from day one!",
    refCta: "Start Your Journey Now", refSubCta: "Free • No Registration Fees",
    refBadges: ["University Registration", "Student Housing", "Visa Support", "Airport Pickup"],
    refStat1V: "19,000+", refStat1L: "Universities Worldwide",
    refStat2V: "50,000+", refStat2L: "Enrolled Students",
    refStat3V: "10+", refStat3L: "Years of Experience",
    refWTop: "Welcome from", refMain: "Your Gateway to Study Abroad",
    refSub: "Baansy brings together 19,000+ universities worldwide in one place",
  },
};

export default function ReferralPage({ lang, theme, navigate }: { lang: Lang; theme: Theme; navigate: (p: string) => void }) {
  const tx = T[lang];
  const { user } = useAuth();
  const isDark = theme === "dark";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "rgba(30,41,59,.9)" : "rgba(255,255,255,.95)";
  const border = isDark ? "#334155" : "#e2e8f0";
  const bg = isDark ? "#0d1117" : "#f8faff";
  const inputBg = isDark ? "#0f172a" : "#f8faff";

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get<ReferralData>("/referrals/me");
      setData(res);
    } catch { } finally { setLoading(false); }
  };

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, borderRadius: 8,
    color: textMain, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: tx.font,
  };

  const statusInfo = (status: string) => {
    if (status === "paid") return { label: tx.statusPaid, color: "#16a34a" };
    if (status === "partial") return { label: tx.statusPartial, color: "#d97706" };
    return { label: tx.statusUnpaid, color: "#ef4444" };
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: tx.font, direction: tx.dir, background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 50%,#1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: cardBg, borderRadius: 20, padding: 40, maxWidth: 400, width: "90%", textAlign: "center", border: `1px solid ${border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: textMain, marginBottom: 12 }}>{tx.loginRequired}</h2>
          <button onClick={() => navigate("login")}
            style={{ width: "100%", padding: "14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: tx.font }}>
            {tx.loginBtn}
          </button>
          <button onClick={() => navigate("home")}
            style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", color: textMuted, border: `1px solid ${border}`, borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: tx.font }}>
            {tx.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: tx.font, direction: tx.dir, backgroundColor: bg, color: textMain }}>
      {/* Header */}
      <div style={{ backgroundColor: isDark ? "#0f172a" : "#fff", borderBottom: `1px solid ${border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 16, height: 60 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: textMain }}>Baansy</div>
          <div style={{ fontSize: 10, color: textMuted }}>{tx.tagline}</div>
        </div>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: tx.font }}>
          {lang === "ar" ? <ArrR size={16} /> : <ArrL size={16} />}{tx.back}
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: textMain, marginBottom: 4 }}>{tx.title}</h1>
          <p style={{ fontSize: 14, color: textMuted }}>{tx.subtitle}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: textMuted }}>{tx.loading}</div>
        ) : data ? (
          <>
            {/* Referral Code & Link */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{tx.myCode}</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ background: isDark ? "#1e3a8a" : "#dbeafe", border: "1px solid #93c5fd", borderRadius: 10, padding: "10px 20px", fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "#1d4ed8", letterSpacing: "0.12em" }}>
                    {data.referralCode}
                  </div>
                  <button onClick={copyLink}
                    style={{ padding: "10px 20px", background: copied ? "#16a34a" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: tx.font, display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s" }}>
                    {copied ? "✓" : "📋"} {copied ? tx.copied : tx.copyLink}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{tx.shareLink}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input readOnly value={data.referralLink} style={{ ...inputStyle, flex: 1, fontSize: 12, color: textMuted }} />
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: tx.totalReferrals, value: data.summary.totalReferrals, color: "#2563eb", icon: "🤝" },
                { label: tx.totalCommission, value: data.summary.totalCommission, color: "#7c3aed", icon: "💰" },
                { label: tx.totalPaid, value: data.summary.totalPaid, color: "#16a34a", icon: "✅" },
                { label: tx.totalUnpaid, value: data.summary.totalUnpaid, color: "#dc2626", icon: "⏳" },
              ].map((card, i) => (
                <div key={i} style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 18px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: card.color, marginBottom: 4 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Referrals List */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: textMain, marginBottom: 16 }}>{tx.referrals}</h2>

              {data.referrals.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: textMain, marginBottom: 6 }}>{tx.noReferrals}</div>
                  <div style={{ fontSize: 13, color: textMuted }}>{tx.noReferralsHint}</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.referrals.map(ref => {
                    const { label: statusLabel, color: statusColor } = statusInfo(ref.paymentStatus);
                    const remaining = Math.max(0, parseFloat(ref.commissionAmount || "0") - parseFloat(ref.paidAmount || "0"));
                    return (
                      <div key={ref.id} style={{ border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px", background: isDark ? "#0f172a" : "#f8faff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: textMain }}>
                              {ref.studentName || (lang === "ar" ? "طالب" : "Student")}
                            </div>
                            {ref.studentEmail && (
                              <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{ref.studentEmail}</div>
                            )}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, background: statusColor + "20", padding: "3px 10px", borderRadius: 20 }}>
                            {statusLabel}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: ref.notes ? 10 : 0 }}>
                          <div style={{ background: isDark ? "#1e293b" : "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>{tx.commission}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>{ref.commissionAmount ?? "—"}</div>
                          </div>
                          <div style={{ background: isDark ? "#1e293b" : "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>{tx.paid}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{ref.paidAmount}</div>
                          </div>
                          <div style={{ background: isDark ? "#1e293b" : "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>{tx.totalUnpaid}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: remaining > 0 ? "#dc2626" : "#16a34a" }}>{remaining.toFixed(2)}</div>
                          </div>
                        </div>

                        {ref.notes && (
                          <div style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginTop: 8 }}>📝 {ref.notes}</div>
                        )}

                        <div style={{ fontSize: 11, color: textMuted, marginTop: 8 }}>
                          {new Date(ref.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}
                          {ref.paidAt && ` · ${lang === "ar" ? "تاريخ الدفع:" : "Paid at:"} ${new Date(ref.paidAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Account Statement */}
            {data.referrals.some(r => parseFloat(r.commissionAmount || "0") > 0) && (
              <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginTop: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: textMain, marginBottom: 16 }}>
                  {lang === "ar" ? "كشف الحساب" : "Account Statement"}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {[tx.student, tx.commission, tx.paid, tx.totalUnpaid, tx.status].map((h, i) => (
                        <th key={i} style={{ padding: "8px 12px", textAlign: lang === "ar" ? "right" : "left", fontSize: 11, fontWeight: 700, color: textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.filter(r => r.commissionAmount).map(ref => {
                      const { label: statusLabel, color: statusColor } = statusInfo(ref.paymentStatus);
                      const remaining = Math.max(0, parseFloat(ref.commissionAmount || "0") - parseFloat(ref.paidAmount || "0"));
                      return (
                        <tr key={ref.id} style={{ borderBottom: `1px solid ${border}` }}>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: textMain }}>{ref.studentName || "—"}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#7c3aed", fontWeight: 700 }}>{ref.commissionAmount}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#16a34a", fontWeight: 700 }}>{ref.paidAmount}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: remaining > 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>{remaining.toFixed(2)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + "20", padding: "2px 8px", borderRadius: 20 }}>{statusLabel}</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: isDark ? "#1e293b" : "#f1f5f9" }}>
                      <td style={{ padding: "12px 12px", fontWeight: 800, fontSize: 13, color: textMain }}>{lang === "ar" ? "الإجمالي" : "Total"}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 800, fontSize: 13, color: "#7c3aed" }}>{data.summary.totalCommission}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 800, fontSize: 13, color: "#16a34a" }}>{data.summary.totalPaid}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 800, fontSize: 13, color: parseFloat(data.summary.totalUnpaid) > 0 ? "#dc2626" : "#16a34a" }}>{data.summary.totalUnpaid}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
