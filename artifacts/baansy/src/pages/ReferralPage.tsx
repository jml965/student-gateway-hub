import { useState, useEffect } from "react";
import { GraduationCap, ArrL, ArrR } from "@/components/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

interface AppRecord {
  status: string;
  universityId: number;
  universityNameAr: string;
  universityNameEn: string;
  universityCountry: string;
  majorNameAr: string;
  majorNameEn: string;
  tuitionFee: string | null;
  currency: string;
  appliedAt: string;
}

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
  stage: "potential" | "applied" | "enrolled";
  applications: AppRecord[];
}

interface UniStatement {
  universityId: number;
  universityNameAr: string;
  universityNameEn: string;
  universityCountry: string;
  students: Array<{
    studentName: string | null;
    studentEmail: string | null;
    majorNameAr: string;
    majorNameEn: string;
    tuitionFee: string | null;
    currency: string;
    commissionAmount: string | null;
    paidAmount: string;
    paymentStatus: string;
  }>;
  totalCommission: string;
  totalPaid: string;
  totalUnpaid: string;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referrals: ReferralItem[];
  universityStatements: UniStatement[];
  summary: {
    totalReferrals: number;
    totalPotential: number;
    totalApplied: number;
    totalEnrolled: number;
    totalCommission: string;
    totalPaid: string;
    totalUnpaid: string;
  };
}

const TX = {
  ar: {
    dir: "rtl" as const, font: "'Cairo','Inter',sans-serif",
    back: "العودة", title: "لوحة الوكيل", tagline: "منصة التسجيل الجامعي الذكية",
    myCode: "كود الإحالة", copyLink: "نسخ الرابط", copied: "تم النسخ!",
    tabs: ["الطلاب المحتملون", "الطلاب المسجلون", "كشف الحساب"],
    potential: "طالب محتمل", applied: "قيد التسجيل", enrolled: "مسجّل",
    noData: "لا يوجد بيانات بعد",
    noDataHint: "شارك رابطك مع الطلاب لبدء تتبع الإحالات",
    student: "الطالب", university: "الجامعة", major: "التخصص",
    commission: "العمولة", paid: "المدفوع", remaining: "المتبقي",
    status: "الحالة", joinDate: "تاريخ الانضمام",
    statusPaid: "مدفوعة", statusPartial: "جزئي", statusUnpaid: "غير مدفوعة",
    loading: "جاري التحميل...",
    loginRequired: "يرجى تسجيل الدخول للوصول إلى لوحة الوكيل",
    loginBtn: "تسجيل الدخول",
    totalStudents: "إجمالي الطلاب", totalPotential: "محتملون",
    totalApplied: "قيد التسجيل", totalEnrolled: "مسجلون",
    totalCommission: "إجمالي العمولات", totalPaid: "المحصّل", totalUnpaid: "المستحق",
    uniStatement: "كشف حساب الجامعات", uniName: "الجامعة",
    rights: "حقوقك", country: "الدولة", tuition: "الرسوم الدراسية",
    total: "الإجمالي", noEnrolled: "لا يوجد طلاب مسجلون بعد",
    applications: "الطلبات",
  },
  en: {
    dir: "ltr" as const, font: "'Inter','Cairo',sans-serif",
    back: "Back", title: "Agent Dashboard", tagline: "Smart University Registration Platform",
    myCode: "Referral Code", copyLink: "Copy Link", copied: "Copied!",
    tabs: ["Potential Students", "Enrolled Students", "Account Statement"],
    potential: "Potential", applied: "In Progress", enrolled: "Enrolled",
    noData: "No data yet",
    noDataHint: "Share your link with students to start tracking referrals",
    student: "Student", university: "University", major: "Major",
    commission: "Commission", paid: "Paid", remaining: "Remaining",
    status: "Status", joinDate: "Join Date",
    statusPaid: "Paid", statusPartial: "Partial", statusUnpaid: "Unpaid",
    loading: "Loading...",
    loginRequired: "Please log in to access the agent dashboard",
    loginBtn: "Log In",
    totalStudents: "Total Students", totalPotential: "Potential",
    totalApplied: "In Progress", totalEnrolled: "Enrolled",
    totalCommission: "Total Commission", totalPaid: "Collected", totalUnpaid: "Outstanding",
    uniStatement: "University Account Statements", uniName: "University",
    rights: "Your Rights", country: "Country", tuition: "Tuition Fee",
    total: "Total", noEnrolled: "No enrolled students yet",
    applications: "Applications",
  },
};

const APP_STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  draft: { ar: "مسودة", en: "Draft", color: "#64748b" },
  submitted: { ar: "مقدّم", en: "Submitted", color: "#2563eb" },
  documents_pending: { ar: "وثائق منتظرة", en: "Docs Pending", color: "#d97706" },
  under_review: { ar: "قيد المراجعة", en: "Under Review", color: "#7c3aed" },
  sent_to_university: { ar: "أُرسل للجامعة", en: "Sent to Uni", color: "#0891b2" },
  preliminary_accepted: { ar: "قبول مبدئي", en: "Pre-Accepted", color: "#16a34a" },
  payment_pending: { ar: "انتظار الدفع", en: "Payment Pending", color: "#d97706" },
  accepted: { ar: "مقبول", en: "Accepted", color: "#16a34a" },
  rejected: { ar: "مرفوض", en: "Rejected", color: "#dc2626" },
  withdrawn: { ar: "منسحب", en: "Withdrawn", color: "#94a3b8" },
};

export default function ReferralPage({ lang, theme, navigate }: { lang: Lang; theme: Theme; navigate: (p: string) => void }) {
  const tx = TX[lang];
  const { user } = useAuth();
  const isDark = theme === "dark";

  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "#1e293b" : "#fff";
  const border = isDark ? "#334155" : "#e2e8f0";
  const pageBg = isDark ? "#0d1117" : "#f1f5f9";
  const inputBg = isDark ? "#0f172a" : "#f8faff";
  const rowAlt = isDark ? "#0f172a" : "#f8faff";

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (user) loadData();
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

  const payStatus = (s: string) => {
    if (s === "paid") return { label: tx.statusPaid, color: "#16a34a" };
    if (s === "partial") return { label: tx.statusPartial, color: "#d97706" };
    return { label: tx.statusUnpaid, color: "#dc2626" };
  };

  const stageColor = (s: string) => {
    if (s === "enrolled") return "#16a34a";
    if (s === "applied") return "#2563eb";
    return "#94a3b8";
  };

  const stageLabel = (s: string) => {
    if (s === "enrolled") return tx.enrolled;
    if (s === "applied") return tx.applied;
    return tx.potential;
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: tx.font, direction: tx.dir, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: cardBg, borderRadius: 20, padding: 40, maxWidth: 400, width: "90%", textAlign: "center", border: `1px solid ${border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: textMain, marginBottom: 16 }}>{tx.loginRequired}</h2>
          <button onClick={() => navigate("login")} style={{ width: "100%", padding: 14, background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: tx.font, marginBottom: 10 }}>{tx.loginBtn}</button>
          <button onClick={() => navigate("home")} style={{ width: "100%", padding: 12, background: "none", color: textMuted, border: `1px solid ${border}`, borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: tx.font }}>{tx.back}</button>
        </div>
      </div>
    );
  }

  const potential = data?.referrals.filter(r => r.stage === "potential") ?? [];
  const enrolled = data?.referrals.filter(r => r.stage === "enrolled") ?? [];
  const inProgress = data?.referrals.filter(r => r.stage === "applied") ?? [];

  return (
    <div style={{ minHeight: "100vh", fontFamily: tx.font, direction: tx.dir, backgroundColor: pageBg, color: textMain }}>
      {/* Header */}
      <div style={{ backgroundColor: isDark ? "#0f172a" : "#fff", borderBottom: `1px solid ${border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 16, height: 60, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 40px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: textMain, marginBottom: 4 }}>{tx.title}</h1>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: textMuted, fontSize: 16 }}>{tx.loading}</div>
        ) : data ? (
          <>
            {/* Referral Code Bar */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{tx.myCode}</div>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#2563eb", letterSpacing: "0.12em", background: isDark ? "#1e3a8a22" : "#dbeafe", display: "inline-block", padding: "6px 16px", borderRadius: 8, border: "1px solid #93c5fd" }}>
                  {data.referralCode}
                </div>
              </div>
              <div style={{ flex: 2, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 6 }}>رابط الإحالة</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input readOnly value={data.referralLink} style={{ flex: 1, background: inputBg, border: `1px solid ${border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: textMuted, fontFamily: tx.font, outline: "none" }} />
                  <button onClick={copyLink} style={{ padding: "7px 16px", background: copied ? "#16a34a" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: tx.font, flexShrink: 0 }}>
                    {copied ? "✓" : "📋"} {copied ? tx.copied : tx.copyLink}
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: tx.totalStudents, value: data.summary.totalReferrals, color: "#2563eb", bg: "#dbeafe" },
                { label: tx.totalPotential, value: data.summary.totalPotential, color: "#64748b", bg: isDark ? "#1e293b" : "#f1f5f9" },
                { label: tx.totalApplied, value: data.summary.totalApplied, color: "#7c3aed", bg: "#ede9fe" },
                { label: tx.totalEnrolled, value: data.summary.totalEnrolled, color: "#16a34a", bg: "#dcfce7" },
                { label: tx.totalCommission, value: `$${data.summary.totalCommission}`, color: "#7c3aed", bg: "#ede9fe" },
                { label: tx.totalPaid, value: `$${data.summary.totalPaid}`, color: "#16a34a", bg: "#dcfce7" },
                { label: tx.totalUnpaid, value: `$${data.summary.totalUnpaid}`, color: parseFloat(data.summary.totalUnpaid) > 0 ? "#dc2626" : "#16a34a", bg: parseFloat(data.summary.totalUnpaid) > 0 ? "#fee2e2" : "#dcfce7" },
              ].map((c, i) => (
                <div key={i} style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: textMuted }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, backgroundColor: isDark ? "#0f172a" : "#e2e8f0", borderRadius: 12, padding: 4 }}>
              {tx.tabs.map((t, i) => (
                <button key={i} onClick={() => setTab(i)} style={{
                  flex: 1, padding: "9px 8px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: tx.font, transition: "all .15s",
                  backgroundColor: tab === i ? (isDark ? "#1e293b" : "#fff") : "transparent",
                  color: tab === i ? textMain : textMuted,
                  boxShadow: tab === i ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                }}>
                  {t}
                  {i === 0 && data.summary.totalPotential > 0 && <span style={{ marginInlineStart: 4, backgroundColor: "#94a3b8", color: "#fff", fontSize: 10, borderRadius: 20, padding: "1px 6px" }}>{data.summary.totalPotential}</span>}
                  {i === 1 && data.summary.totalEnrolled > 0 && <span style={{ marginInlineStart: 4, backgroundColor: "#16a34a", color: "#fff", fontSize: 10, borderRadius: 20, padding: "1px 6px" }}>{data.summary.totalEnrolled}</span>}
                </button>
              ))}
            </div>

            {/* ── Tab 0: Potential Students ── */}
            {tab === 0 && (
              <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                {[...potential, ...inProgress].length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🎓</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: textMain, marginBottom: 6 }}>{tx.noData}</div>
                    <div style={{ fontSize: 13, color: textMuted }}>{tx.noDataHint}</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: isDark ? "#0f172a" : "#f8faff", borderBottom: `1px solid ${border}` }}>
                        {[tx.student, tx.status, tx.applications, tx.joinDate].map((h, i) => (
                          <th key={i} style={{ padding: "12px 16px", textAlign: lang === "ar" ? "right" : "left", fontSize: 11, fontWeight: 700, color: textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...inProgress, ...potential].map((ref, idx) => (
                        <tr key={ref.id} style={{ borderBottom: `1px solid ${border}`, backgroundColor: idx % 2 === 0 ? cardBg : rowAlt }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: textMain }}>{ref.studentName || "—"}</div>
                            {ref.studentEmail && <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{ref.studentEmail}</div>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: stageColor(ref.stage), background: stageColor(ref.stage) + "22", padding: "3px 10px", borderRadius: 20 }}>{stageLabel(ref.stage)}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {ref.applications.length === 0 ? (
                              <span style={{ fontSize: 12, color: textMuted }}>—</span>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {ref.applications.slice(0, 3).map((app, ai) => {
                                  const appSt = APP_STATUS_LABELS[app.status] ?? { ar: app.status, en: app.status, color: "#64748b" };
                                  return (
                                    <div key={ai} style={{ fontSize: 11, color: textMuted }}>
                                      <span style={{ fontWeight: 600, color: textMain }}>{lang === "ar" ? app.universityNameAr : app.universityNameEn}</span>
                                      {" · "}
                                      <span style={{ color: appSt.color, fontWeight: 600 }}>{lang === "ar" ? appSt.ar : appSt.en}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: textMuted }}>{fmtDate(ref.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Tab 1: Enrolled Students ── */}
            {tab === 1 && (
              <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                {enrolled.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🏛️</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: textMain, marginBottom: 6 }}>{tx.noEnrolled}</div>
                    <div style={{ fontSize: 13, color: textMuted }}>{tx.noDataHint}</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: isDark ? "#0f172a" : "#f8faff", borderBottom: `1px solid ${border}` }}>
                        {[tx.student, tx.university, tx.major, tx.commission, tx.paid, tx.remaining, tx.status].map((h, i) => (
                          <th key={i} style={{ padding: "12px 16px", textAlign: lang === "ar" ? "right" : "left", fontSize: 11, fontWeight: 700, color: textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enrolled.map((ref, idx) => {
                        const acceptedApps = ref.applications.filter(a => a.status === "accepted");
                        const comm = parseFloat(ref.commissionAmount || "0");
                        const paid = parseFloat(ref.paidAmount || "0");
                        const rem = Math.max(0, comm - paid);
                        const { label: statusLabel, color: statusColor } = payStatus(ref.paymentStatus);
                        return acceptedApps.map((app, ai) => (
                          <tr key={`${ref.id}-${ai}`} style={{ borderBottom: `1px solid ${border}`, backgroundColor: idx % 2 === 0 ? cardBg : rowAlt }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: textMain }}>{ref.studentName || "—"}</div>
                              {ref.studentEmail && <div style={{ fontSize: 11, color: textMuted }}>{ref.studentEmail}</div>}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{lang === "ar" ? app.universityNameAr : app.universityNameEn}</div>
                              <div style={{ fontSize: 11, color: textMuted }}>{app.universityCountry}</div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontSize: 12, color: textMain }}>{lang === "ar" ? app.majorNameAr : app.majorNameEn}</div>
                              {app.tuitionFee && <div style={{ fontSize: 11, color: textMuted }}>{app.currency} {parseFloat(app.tuitionFee).toLocaleString()}</div>}
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{ref.commissionAmount ? `$${ref.commissionAmount}` : "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>${ref.paidAmount}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: rem > 0 ? "#dc2626" : "#16a34a" }}>${rem.toFixed(2)}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + "22", padding: "3px 10px", borderRadius: 20 }}>{statusLabel}</span>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Tab 2: Account Statement per University ── */}
            {tab === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.universityStatements.length === 0 ? (
                  <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: textMain, marginBottom: 6 }}>{tx.noEnrolled}</div>
                    <div style={{ fontSize: 13, color: textMuted }}>{tx.noDataHint}</div>
                  </div>
                ) : (
                  data.universityStatements.map((uni) => (
                    <div key={uni.universityId} style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                      {/* University Header */}
                      <div style={{ backgroundColor: isDark ? "#0f172a" : "#eff6ff", borderBottom: `1px solid ${border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: textMain }}>{lang === "ar" ? uni.universityNameAr : uni.universityNameEn}</div>
                          <div style={{ fontSize: 12, color: textMuted }}>{uni.universityCountry}</div>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                          {[
                            { label: tx.totalCommission, val: `$${uni.totalCommission}`, color: "#7c3aed" },
                            { label: tx.totalPaid, val: `$${uni.totalPaid}`, color: "#16a34a" },
                            { label: tx.rights, val: `$${uni.totalUnpaid}`, color: parseFloat(uni.totalUnpaid) > 0 ? "#dc2626" : "#16a34a" },
                          ].map((s, i) => (
                            <div key={i} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                              <div style={{ fontSize: 10, color: textMuted, fontWeight: 600 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Students Table */}
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${border}` }}>
                            {[tx.student, tx.major, tx.tuition, tx.commission, tx.paid, tx.remaining, tx.status].map((h, i) => (
                              <th key={i} style={{ padding: "10px 16px", textAlign: lang === "ar" ? "right" : "left", fontSize: 11, fontWeight: 700, color: textMuted }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uni.students.map((s, si) => {
                            const comm = parseFloat(s.commissionAmount || "0");
                            const paid = parseFloat(s.paidAmount || "0");
                            const rem = Math.max(0, comm - paid);
                            const { label: statusLabel, color: statusColor } = payStatus(s.paymentStatus);
                            return (
                              <tr key={si} style={{ borderBottom: `1px solid ${border}`, backgroundColor: si % 2 === 0 ? cardBg : rowAlt }}>
                                <td style={{ padding: "10px 16px" }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{s.studentName || "—"}</div>
                                  {s.studentEmail && <div style={{ fontSize: 11, color: textMuted }}>{s.studentEmail}</div>}
                                </td>
                                <td style={{ padding: "10px 16px", fontSize: 12, color: textMain }}>{lang === "ar" ? s.majorNameAr : s.majorNameEn}</td>
                                <td style={{ padding: "10px 16px", fontSize: 12, color: textMuted }}>{s.tuitionFee ? `${s.currency} ${parseFloat(s.tuitionFee).toLocaleString()}` : "—"}</td>
                                <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{s.commissionAmount ? `$${s.commissionAmount}` : "—"}</td>
                                <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>${s.paidAmount}</td>
                                <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: rem > 0 ? "#dc2626" : "#16a34a" }}>${rem.toFixed(2)}</td>
                                <td style={{ padding: "10px 16px" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + "22", padding: "2px 10px", borderRadius: 20 }}>{statusLabel}</span>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Total Row */}
                          <tr style={{ backgroundColor: isDark ? "#1e3a8a22" : "#eff6ff", borderTop: `2px solid ${border}` }}>
                            <td colSpan={3} style={{ padding: "10px 16px", fontWeight: 800, fontSize: 13, color: textMain }}>{tx.total}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 800, fontSize: 13, color: "#7c3aed" }}>${uni.totalCommission}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 800, fontSize: 13, color: "#16a34a" }}>${uni.totalPaid}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 800, fontSize: 13, color: parseFloat(uni.totalUnpaid) > 0 ? "#dc2626" : "#16a34a" }}>${uni.totalUnpaid}</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
