import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Lang = "ar" | "en";
type Theme = "light" | "dark";
type Tab = "dashboard" | "analytics" | "applications" | "specializations" | "profile";

interface Specialization {
  id: number; nameAr: string; nameEn: string;
  degree: string; durationYears: number;
  tuitionFee: string | null; currency: string; status: string;
  requirementsJson?: any;
}
interface UniversityProfile {
  id: number; nameAr: string; nameEn: string;
  country: string; city: string; website: string | null;
  logoUrl: string | null; email: string | null; phone: string | null;
  address: string | null; descriptionAr: string | null; descriptionEn: string | null;
  status: string; paymentMode: string; createdAt: string; approvedAt: string | null;
  specializations: Specialization[];
}
interface Analytics {
  totalApplications: number;
  byStatus: Record<string, number>;
  bySpecialization: { specId: number; nameAr: string; nameEn: string; degree: string; count: number }[];
  byCountry: { country: string; count: number }[];
  topCountries: { country: string; count: number }[];
  incompleteApplications: number;
  acceptedRate: number;
  studentsElsewhere: number;
  chatMentions: number;
  potentialStudents: number;
  convertedFromChat: number;
  conversionFunnel: { chatInquiries: number; applications: number; submitted: number; accepted: number };
  weeklyTrend: { date: string; count: number }[];
  uniqueStudents: number;
}
interface Application {
  id: number; status: string; notes: string | null;
  submittedAt: string | null; createdAt: string;
  studentId: number; specializationId: number;
  studentName: string; studentEmail: string;
  studentCountry: string | null; studentPhone: string | null;
  specNameAr: string; specNameEn: string; degree: string;
  requirementsJson?: any;
  aiResult?: { classification: "match" | "close" | "no_match"; score: number; reasoning: string; recommendations: string };
}

const T = {
  ar: {
    dir: "rtl" as const,
    title: "بوابة الجامعة",
    tabDash: "لوحة التحكم", tabAnalytics: "الإحصائيات",
    tabApps: "الطلبات", tabSpecs: "التخصصات", tabProfile: "الملف الشخصي",
    status: "حالة الجامعة",
    statusPending: "⏳ قيد المراجعة",
    statusActive: "✅ معتمدة",
    statusRejected: "❌ مرفوضة",
    statusInactive: "⛔ موقوفة",
    logout: "تسجيل الخروج",
    loading: "جارٍ التحميل...",
    totalApps: "إجمالي الطلبات", uniqueStudents: "الطلاب الفريدون",
    accepted: "مقبولون", acceptedRate: "معدل القبول",
    incomplete: "طلبات غير مكتملة", elsewhere: "تقدموا لجامعات أخرى",
    chatMentions: "إشارات الجامعة في الدردشة", potentialStudents: "طلاب محتملون عبر الدردشة",
    convertedFromChat: "تحوّلوا لطلاب فعليين",
    byStatus: "الطلبات حسب الحالة", bySpec: "الطلبات حسب التخصص",
    byCountry: "الطلاب حسب الدولة", weeklyTrend: "الطلبات هذا الأسبوع",
    funnel: "مسار التحويل",
    funnelChat: "استفسار عبر الدردشة", funnelApplied: "قدّموا طلباً",
    funnelSubmitted: "أتمّوا التقديم", funnelAccepted: "مقبولون",
    applications: "قائمة الطلبات", aiAnalyze: "تحليل بالذكاء الاصطناعي",
    analyzing: "جارٍ التحليل...",
    bulkApprove: "قبول المحددين", bulkReject: "رفض المحددين", bulkReview: "وضع قيد المراجعة",
    approveAllMatch: "قبول جميع المتطابقين",
    rejectAllNoMatch: "رفض جميع غير المتطابقين",
    reviewAllClose: "مراجعة القريبين",
    student: "الطالب", country: "الدولة", spec: "التخصص", statusCol: "الحالة",
    aiScore: "تقييم الذكاء", aiClass: "التصنيف", action: "الإجراء",
    match: "✅ متطابق", close: "🟡 قريب", no_match: "❌ غير متطابق",
    approve: "قبول", reject: "رفض", review: "مراجعة",
    filterAll: "الكل", filterSubmitted: "مُقدَّم", filterDraft: "مسودة",
    filterAccepted: "مقبول", filterRejected: "مرفوض",
    noApps: "لا توجد طلبات",
    editProfile: "تعديل الملف", saveProfile: "حفظ التغييرات", saving: "جارٍ الحفظ...",
    nameAr: "الاسم (عربي)", nameEn: "الاسم (إنجليزي)", city: "المدينة",
    website: "الموقع", phone: "الهاتف", address: "العنوان",
    descAr: "الوصف (عربي)", descEn: "الوصف (إنجليزي)", logoUrl: "رابط الشعار",
    addSpecBtn: "+ إضافة تخصص", specNameAr: "اسم التخصص (عربي)",
    specNameEn: "اسم التخصص (إنجليزي)", degree: "الدرجة", duration: "المدة (سنوات)",
    fee: "الرسوم", currency: "العملة",
    save: "حفظ", cancel: "إلغاء", edit: "تعديل", delete: "حذف",
    bachelor: "بكالوريوس", master: "ماجستير", phd: "دكتوراه", diploma: "دبلوم",
    noSpecs: "لا توجد تخصصات",
    approvedOn: "تاريخ الاعتماد:",
    pendingNote: "يمكنك تعديل بيانات جامعتك في انتظار الموافقة.",
    lockedNote: "لا يمكن إضافة التخصصات إلا بعد الموافقة.",
    reasoning: "التحليل", recommendations: "التوصيات",
    selectAll: "تحديد الكل", deselectAll: "إلغاء التحديد",
  },
  en: {
    dir: "ltr" as const,
    title: "University Portal",
    tabDash: "Dashboard", tabAnalytics: "Analytics",
    tabApps: "Applications", tabSpecs: "Specializations", tabProfile: "Profile",
    status: "University Status",
    statusPending: "⏳ Pending Review",
    statusActive: "✅ Approved",
    statusRejected: "❌ Rejected",
    statusInactive: "⛔ Suspended",
    logout: "Logout",
    loading: "Loading...",
    totalApps: "Total Applications", uniqueStudents: "Unique Students",
    accepted: "Accepted", acceptedRate: "Acceptance Rate",
    incomplete: "Incomplete Applications", elsewhere: "Applied Elsewhere",
    chatMentions: "Chat Mentions", potentialStudents: "Potential via Chat",
    convertedFromChat: "Converted to Applicants",
    byStatus: "Applications by Status", bySpec: "Applications by Specialization",
    byCountry: "Students by Country", weeklyTrend: "This Week's Applications",
    funnel: "Conversion Funnel",
    funnelChat: "Chat Inquiry", funnelApplied: "Applied",
    funnelSubmitted: "Submitted", funnelAccepted: "Accepted",
    applications: "Applications", aiAnalyze: "AI Analysis",
    analyzing: "Analyzing...",
    bulkApprove: "Approve Selected", bulkReject: "Reject Selected", bulkReview: "Set Under Review",
    approveAllMatch: "Approve All Matching",
    rejectAllNoMatch: "Reject All Non-Matching",
    reviewAllClose: "Review All Close Matches",
    student: "Student", country: "Country", spec: "Specialization", statusCol: "Status",
    aiScore: "AI Score", aiClass: "AI Class", action: "Action",
    match: "✅ Match", close: "🟡 Close", no_match: "❌ No Match",
    approve: "Approve", reject: "Reject", review: "Review",
    filterAll: "All", filterSubmitted: "Submitted", filterDraft: "Draft",
    filterAccepted: "Accepted", filterRejected: "Rejected",
    noApps: "No applications found",
    editProfile: "Edit Profile", saveProfile: "Save Changes", saving: "Saving...",
    nameAr: "Name (Arabic)", nameEn: "Name (English)", city: "City",
    website: "Website", phone: "Phone", address: "Address",
    descAr: "Description (Arabic)", descEn: "Description (English)", logoUrl: "Logo URL",
    addSpecBtn: "+ Add Specialization", specNameAr: "Name (Arabic)",
    specNameEn: "Name (English)", degree: "Degree", duration: "Duration (years)",
    fee: "Tuition Fee", currency: "Currency",
    save: "Save", cancel: "Cancel", edit: "Edit", delete: "Delete",
    bachelor: "Bachelor", master: "Master", phd: "PhD", diploma: "Diploma",
    noSpecs: "No specializations added yet",
    approvedOn: "Approved on:",
    pendingNote: "You can edit your university information while awaiting approval.",
    lockedNote: "Specializations can only be added after your university is approved.",
    reasoning: "Analysis", recommendations: "Recommendations",
    selectAll: "Select All", deselectAll: "Deselect All",
  },
};

interface Props { lang: Lang; theme: Theme; navigate: (p: string) => void; }

export default function UniversityPortalPage({ lang, theme, navigate }: Props) {
  const t = T[lang];
  const isDark = theme === "dark";
  const { logout } = useAuth();
  const bg = isDark ? "#0d1117" : "#f0f4ff";
  const card = isDark ? "#161b27" : "#ffffff";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d3748" : "#e2e8f0";
  const blue = "#2563eb";

  const [tab, setTab] = useState<Tab>("dashboard");
  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appFilter, setAppFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UniversityProfile>>({});
  const [saving, setSaving] = useState(false);
  const [showAddSpec, setShowAddSpec] = useState(false);
  const [specForm, setSpecForm] = useState({ nameAr: "", nameEn: "", degree: "bachelor", durationYears: 4, tuitionFee: "", currency: "USD" });
  const [editSpec, setEditSpec] = useState<Specialization | null>(null);
  const [selectedApps, setSelectedApps] = useState<Set<number>>(new Set());
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [bulkActing, setBulkActing] = useState(false);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<UniversityProfile>("/university-portal/profile");
      setProfile(data);
      setEditForm(data);
    } catch { navigate("home"); } finally { setLoading(false); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await api.get<Analytics>("/university-portal/analytics");
      setAnalytics(data);
    } catch {} finally { setAnalyticsLoading(false); }
  }, []);

  const loadApplications = useCallback(async (status?: string) => {
    setAppsLoading(true);
    try {
      const url = status && status !== "all" ? `/university-portal/applications?status=${status}` : "/university-portal/applications";
      const data = await api.get<Application[]>(url);
      setApplications(data);
      setSelectedApps(new Set());
    } catch {} finally { setAppsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "analytics") loadAnalytics(); }, [tab]);
  useEffect(() => { if (tab === "applications") loadApplications(appFilter); }, [tab, appFilter]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.put<UniversityProfile>("/university-portal/profile", {
        nameAr: editForm.nameAr, nameEn: editForm.nameEn,
        city: editForm.city, website: editForm.website,
        descriptionAr: editForm.descriptionAr, descriptionEn: editForm.descriptionEn,
        phone: editForm.phone, address: editForm.address, logoUrl: editForm.logoUrl,
      });
      setProfile(p => ({ ...p!, ...updated }));
      setEditing(false);
    } catch {} finally { setSaving(false); }
  };

  const addSpec = async () => {
    try {
      const spec = await api.post<Specialization>("/university-portal/specializations", { ...specForm, durationYears: Number(specForm.durationYears) });
      setProfile(p => p ? { ...p, specializations: [...p.specializations, spec] } : p);
      setShowAddSpec(false);
      setSpecForm({ nameAr: "", nameEn: "", degree: "bachelor", durationYears: 4, tuitionFee: "", currency: "USD" });
    } catch {}
  };

  const updateSpec = async () => {
    if (!editSpec) return;
    try {
      const updated = await api.put<Specialization>(`/university-portal/specializations/${editSpec.id}`, editSpec);
      setProfile(p => p ? { ...p, specializations: p.specializations.map(s => s.id === updated.id ? updated : s) } : p);
      setEditSpec(null);
    } catch {}
  };

  const deleteSpec = async (id: number) => {
    try {
      await api.delete(`/university-portal/specializations/${id}`);
      setProfile(p => p ? { ...p, specializations: p.specializations.filter(s => s.id !== id) } : p);
    } catch {}
  };

  const runAiAnalysis = async (ids: number[]) => {
    setAiAnalyzing(true);
    try {
      const results = await api.post<{ applicationId: number; classification: string; score: number; reasoning: string; recommendations: string }[]>(
        "/university-portal/applications/ai-analyze", { applicationIds: ids }
      );
      setApplications(prev => prev.map(app => {
        const r = results.find(x => x.applicationId === app.id);
        return r ? { ...app, aiResult: r as any } : app;
      }));
    } catch {} finally { setAiAnalyzing(false); }
  };

  const bulkAction = async (action: "approve" | "reject" | "review", ids?: number[]) => {
    const targetIds = ids ?? [...selectedApps];
    if (!targetIds.length) return;
    setBulkActing(true);
    try {
      await api.post("/university-portal/applications/bulk-action", { applicationIds: targetIds, action });
      await loadApplications(appFilter);
    } catch {} finally { setBulkActing(false); }
  };

  const singleAction = async (appId: number, status: string) => {
    try {
      await api.put(`/university-portal/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch {}
  };

  const toggleSelect = (id: number) => setSelectedApps(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleLogout = async () => { await logout(); navigate("home"); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: muted, fontSize: 16 }}>{t.loading}</div>
      </div>
    );
  }
  if (!profile) return null;

  const statusMsg = { pending: t.statusPending, active: t.statusActive, rejected: t.statusRejected, inactive: t.statusInactive }[profile.status] ?? profile.status;
  const statusColor = { pending: "#f59e0b", active: "#10b981", rejected: "#ef4444", inactive: "#6b7280" }[profile.status] ?? muted;
  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", border: `1.5px solid ${border}`, borderRadius: 8, background: isDark ? "#1e2537" : "#f8faff", color: text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: lang === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif" };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: muted, marginBottom: 4, display: "block" };
  const degreeOpts = [{ v: "bachelor", l: t.bachelor }, { v: "master", l: t.master }, { v: "phd", l: t.phd }, { v: "diploma", l: t.diploma }];

  const filteredApps = applications;
  const matchIds = applications.filter(a => a.aiResult?.classification === "match").map(a => a.id);
  const closeIds = applications.filter(a => a.aiResult?.classification === "close").map(a => a.id);
  const noMatchIds = applications.filter(a => a.aiResult?.classification === "no_match").map(a => a.id);

  const statuses = ["draft", "submitted", "documents_pending", "under_review", "sent_to_university", "preliminary_accepted", "payment_pending", "accepted", "rejected", "withdrawn"];
  const statusColors: Record<string, string> = {
    draft: "#94a3b8", submitted: "#3b82f6", documents_pending: "#f59e0b",
    under_review: "#8b5cf6", sent_to_university: "#06b6d4",
    preliminary_accepted: "#10b981", payment_pending: "#f97316",
    accepted: "#10b981", rejected: "#ef4444", withdrawn: "#6b7280",
  };
  const statusLabels: Record<string, { ar: string; en: string }> = {
    draft: { ar: "مسودة", en: "Draft" },
    submitted: { ar: "مُقدَّم", en: "Submitted" },
    documents_pending: { ar: "مستندات ناقصة", en: "Docs Pending" },
    under_review: { ar: "قيد المراجعة", en: "Under Review" },
    sent_to_university: { ar: "أُرسل للجامعة", en: "Sent to University" },
    preliminary_accepted: { ar: "قبول مبدئي", en: "Prelim. Accepted" },
    payment_pending: { ar: "دفع معلق", en: "Payment Pending" },
    accepted: { ar: "مقبول", en: "Accepted" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    withdrawn: { ar: "انسحب", en: "Withdrawn" },
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, direction: t.dir, fontFamily: lang === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif", overflowY: "auto" }}>
      {/* Top bar */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏛️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: text }}>{lang === "ar" ? profile.nameAr : profile.nameEn}</div>
            <div style={{ fontSize: 11, color: muted }}>{t.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: statusColor, fontWeight: 600, background: statusColor + "22", padding: "4px 10px", borderRadius: 20 }}>{statusMsg}</span>
          <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "6px 14px", color: muted, cursor: "pointer", fontSize: 13 }}>{t.logout}</button>
        </div>
      </div>

      {profile.status === "pending" && (
        <div style={{ background: isDark ? "#1c1400" : "#fef3c7", color: isDark ? "#fbbf24" : "#92400e", padding: "8px 24px", fontSize: 13, textAlign: "center" }}>{t.pendingNote}</div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: card, borderRadius: 12, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexWrap: "wrap" }}>
          {(["dashboard", "analytics", "applications", "specializations", "profile"] as Tab[]).map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              flex: 1, minWidth: 80, padding: "9px 8px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === tb ? blue : "transparent", color: tab === tb ? "#fff" : muted, transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              {tb === "dashboard" ? t.tabDash : tb === "analytics" ? t.tabAnalytics : tb === "applications" ? t.tabApps : tb === "specializations" ? t.tabSpecs : t.tabProfile}
            </button>
          ))}
        </div>

        {/* ─── DASHBOARD TAB ───────────────────────────────────────────────── */}
        {tab === "dashboard" && (
          <div>
            {analytics === null && !analyticsLoading && (
              <button onClick={loadAnalytics} style={{ marginBottom: 16, background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                {lang === "ar" ? "تحميل الإحصائيات" : "Load Analytics"}
              </button>
            )}
            {analyticsLoading && <div style={{ color: muted, padding: 40, textAlign: "center" }}>{t.loading}</div>}
            {analytics && (
              <>
                {/* Stat Cards Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: t.totalApps, value: analytics.totalApplications, icon: "📋", color: blue },
                    { label: t.uniqueStudents, value: analytics.uniqueStudents, icon: "👥", color: "#10b981" },
                    { label: t.acceptedRate, value: `${analytics.acceptedRate}%`, icon: "✅", color: "#10b981" },
                    { label: t.incomplete, value: analytics.incompleteApplications, icon: "⏳", color: "#f59e0b" },
                    { label: t.elsewhere, value: analytics.studentsElsewhere, icon: "🔄", color: "#8b5cf6" },
                    { label: t.potentialStudents, value: analytics.potentialStudents, icon: "💬", color: "#06b6d4" },
                    { label: t.convertedFromChat, value: analytics.convertedFromChat, icon: "🎯", color: "#f97316" },
                    { label: t.chatMentions, value: analytics.chatMentions, icon: "🔍", color: "#64748b" },
                  ].map(s => (
                    <div key={s.label} style={{ background: card, borderRadius: 14, padding: "18px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}` }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Conversion Funnel + Weekly Trend */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {/* Funnel */}
                  <div style={{ background: card, borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}` }}>
                    <h3 style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{t.funnel}</h3>
                    {[
                      { label: t.funnelChat, value: analytics.conversionFunnel.chatInquiries, color: "#06b6d4" },
                      { label: t.funnelApplied, value: analytics.conversionFunnel.applications, color: blue },
                      { label: t.funnelSubmitted, value: analytics.conversionFunnel.submitted, color: "#8b5cf6" },
                      { label: t.funnelAccepted, value: analytics.conversionFunnel.accepted, color: "#10b981" },
                    ].map((f, i) => {
                      const max = analytics.conversionFunnel.chatInquiries || 1;
                      const pct = Math.round((f.value / max) * 100);
                      return (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: muted }}>{f.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.value}</span>
                          </div>
                          <div style={{ height: 8, background: isDark ? "#1e2537" : "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: f.color, borderRadius: 4, transition: "width 0.6s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly Trend */}
                  <div style={{ background: card, borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}` }}>
                    <h3 style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{t.weeklyTrend}</h3>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                      {analytics.weeklyTrend.map((day, i) => {
                        const max = Math.max(...analytics.weeklyTrend.map(d => d.count), 1);
                        const h = Math.max((day.count / max) * 72, 4);
                        return (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ width: "100%", height: h, background: blue + "cc", borderRadius: "3px 3px 0 0", minHeight: 4 }} />
                            <span style={{ fontSize: 10, color: muted }}>{day.date.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Countries */}
                {analytics.topCountries.length > 0 && (
                  <div style={{ background: card, borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}`, marginBottom: 20 }}>
                    <h3 style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{t.byCountry} (Top 5)</h3>
                    {analytics.topCountries.map(c => {
                      const max = analytics.topCountries[0].count;
                      return (
                        <div key={c.country} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span style={{ fontSize: 13, color: text, minWidth: 100, fontWeight: 500 }}>{c.country}</span>
                          <div style={{ flex: 1, height: 10, background: isDark ? "#1e2537" : "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(c.count / max) * 100}%`, background: blue, borderRadius: 5 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: blue, minWidth: 24, textAlign: "center" }}>{c.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── ANALYTICS TAB ───────────────────────────────────────────────── */}
        {tab === "analytics" && (
          <div>
            {analyticsLoading && <div style={{ color: muted, padding: 40, textAlign: "center" }}>{t.loading}</div>}
            {analytics && !analyticsLoading && (
              <>
                {/* By Status */}
                <div style={{ background: card, borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}`, marginBottom: 20 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>{t.byStatus}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                    {statuses.filter(s => analytics.byStatus[s] !== undefined).map(s => (
                      <div key={s} style={{ background: isDark ? "#1e2537" : "#f8faff", borderRadius: 10, padding: "14px 16px", border: `1px solid ${border}` }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: statusColors[s] }}>{analytics.byStatus[s] ?? 0}</div>
                        <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{statusLabels[s]?.[lang] ?? s}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Specialization */}
                {analytics.bySpecialization.length > 0 && (
                  <div style={{ background: card, borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}`, marginBottom: 20 }}>
                    <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>{t.bySpec}</h3>
                    {analytics.bySpecialization.sort((a, b) => b.count - a.count).map(s => {
                      const max = analytics.bySpecialization[0].count;
                      return (
                        <div key={s.specId} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{lang === "ar" ? s.nameAr : s.nameEn}</span>
                              <span style={{ fontSize: 11, color: muted, marginInlineStart: 8 }}>{degreeOpts.find(d => d.v === s.degree)?.l}</span>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: blue }}>{s.count}</span>
                          </div>
                          <div style={{ height: 8, background: isDark ? "#1e2537" : "#f1f5f9", borderRadius: 4 }}>
                            <div style={{ height: "100%", width: `${(s.count / max) * 100}%`, background: blue + "cc", borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* By Country (Full) */}
                {analytics.byCountry.length > 0 && (
                  <div style={{ background: card, borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}`, marginBottom: 20 }}>
                    <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>{t.byCountry} ({analytics.byCountry.length})</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                      {analytics.byCountry.map(c => (
                        <div key={c.country} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isDark ? "#1e2537" : "#f8faff", borderRadius: 8, padding: "10px 14px", border: `1px solid ${border}` }}>
                          <span style={{ fontSize: 13, color: text }}>{c.country}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: blue }}>{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Intelligence */}
                <div style={{ background: card, borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}`, marginBottom: 20 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>
                    {lang === "ar" ? "🤖 ذكاء الدردشة" : "🤖 Chat Intelligence"}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                    {[
                      { label: t.chatMentions, value: analytics.chatMentions, desc: lang === "ar" ? "محادثات ذكر فيها اسم الجامعة" : "Chat sessions mentioning this university", color: "#06b6d4" },
                      { label: t.potentialStudents, value: analytics.potentialStudents, desc: lang === "ar" ? "مستخدمون تحدثوا عن الجامعة" : "Users who talked about this university", color: "#8b5cf6" },
                      { label: t.convertedFromChat, value: analytics.convertedFromChat, desc: lang === "ar" ? "تحولوا لمتقدمين فعليين" : "Chat users who applied", color: "#10b981" },
                    ].map(s => (
                      <div key={s.label} style={{ background: isDark ? "#1e2537" : "#f8faff", borderRadius: 10, padding: 16, border: `1px solid ${border}` }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginTop: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Students Elsewhere */}
                <div style={{ background: card, borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${border}`, marginBottom: 20 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>
                    {lang === "ar" ? "🔄 الطلاب الذين تقدموا لجامعات أخرى" : "🔄 Students Who Applied Elsewhere"}
                  </h3>
                  <p style={{ color: muted, fontSize: 13, margin: 0 }}>
                    {lang === "ar"
                      ? `${analytics.studentsElsewhere} طالب تقدم لجامعتك وأيضاً لجامعات أخرى — هؤلاء في مرحلة مقارنة الخيارات.`
                      : `${analytics.studentsElsewhere} students who applied to your university also applied elsewhere — they are comparison shopping.`}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── APPLICATIONS TAB ────────────────────────────────────────────── */}
        {tab === "applications" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["all", "submitted", "draft", "under_review", "accepted", "rejected"].map(f => (
                <button key={f} onClick={() => setAppFilter(f)} style={{
                  padding: "6px 14px", border: `1px solid ${appFilter === f ? blue : border}`,
                  borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: appFilter === f ? blue : card, color: appFilter === f ? "#fff" : muted,
                }}>
                  {f === "all" ? t.filterAll : f === "submitted" ? t.filterSubmitted : f === "draft" ? t.filterDraft : f === "under_review" ? (lang === "ar" ? "قيد المراجعة" : "Under Review") : f === "accepted" ? t.filterAccepted : t.filterRejected}
                </button>
              ))}
            </div>

            {/* AI Toolbar */}
            <div style={{ background: card, borderRadius: 12, padding: "14px 16px", marginBottom: 14, border: `1px solid ${border}`, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: text }}>🤖 {t.aiAnalyze}</span>
              <button onClick={() => runAiAnalysis(filteredApps.map(a => a.id))} disabled={aiAnalyzing || filteredApps.length === 0}
                style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, opacity: aiAnalyzing ? 0.6 : 1 }}>
                {aiAnalyzing ? t.analyzing : (lang === "ar" ? `تحليل جميع الطلبات (${filteredApps.length})` : `Analyze All (${filteredApps.length})`)}
              </button>
              {matchIds.length > 0 && (
                <button onClick={() => bulkAction("approve", matchIds)} disabled={bulkActing}
                  style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {t.approveAllMatch} ({matchIds.length})
                </button>
              )}
              {closeIds.length > 0 && (
                <button onClick={() => bulkAction("review", closeIds)} disabled={bulkActing}
                  style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {t.reviewAllClose} ({closeIds.length})
                </button>
              )}
              {noMatchIds.length > 0 && (
                <button onClick={() => bulkAction("reject", noMatchIds)} disabled={bulkActing}
                  style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {t.rejectAllNoMatch} ({noMatchIds.length})
                </button>
              )}
            </div>

            {/* Bulk Actions for Selected */}
            {selectedApps.size > 0 && (
              <div style={{ background: isDark ? "#1e2537" : "#eff6ff", borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: blue, fontWeight: 600 }}>
                  {lang === "ar" ? `${selectedApps.size} محدد` : `${selectedApps.size} selected`}
                </span>
                <button onClick={() => bulkAction("approve")} disabled={bulkActing} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.bulkApprove}</button>
                <button onClick={() => bulkAction("review")} disabled={bulkActing} style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.bulkReview}</button>
                <button onClick={() => bulkAction("reject")} disabled={bulkActing} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.bulkReject}</button>
                <button onClick={() => setSelectedApps(new Set())} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: muted }}>{t.deselectAll}</button>
              </div>
            )}

            {appsLoading ? (
              <div style={{ color: muted, padding: 40, textAlign: "center" }}>{t.loading}</div>
            ) : filteredApps.length === 0 ? (
              <div style={{ background: card, borderRadius: 12, padding: 40, textAlign: "center", color: muted }}>{t.noApps}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Select All */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => {
                    if (selectedApps.size === filteredApps.length) setSelectedApps(new Set());
                    else setSelectedApps(new Set(filteredApps.map(a => a.id)));
                  }} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: muted }}>
                    {selectedApps.size === filteredApps.length ? t.deselectAll : t.selectAll}
                  </button>
                </div>

                {filteredApps.map(app => {
                  const appStatus = statusColors[app.status] || "#94a3b8";
                  const aiClass = app.aiResult?.classification;
                  const aiColor = aiClass === "match" ? "#10b981" : aiClass === "close" ? "#f59e0b" : aiClass === "no_match" ? "#ef4444" : muted;
                  const isExpanded = expandedApp === app.id;

                  return (
                    <div key={app.id} style={{ background: card, borderRadius: 12, border: `1px solid ${selectedApps.has(app.id) ? blue : border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                      <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        {/* Checkbox */}
                        <input type="checkbox" checked={selectedApps.has(app.id)} onChange={() => toggleSelect(app.id)}
                          style={{ marginTop: 4, accentColor: blue, cursor: "pointer", flexShrink: 0 }} />

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: text }}>{app.studentName}</span>
                            {app.studentCountry && <span style={{ fontSize: 12, color: muted }}>🌍 {app.studentCountry}</span>}
                            <span style={{ fontSize: 12, background: appStatus + "22", color: appStatus, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                              {statusLabels[app.status]?.[lang] ?? app.status}
                            </span>
                            {aiClass && (
                              <span style={{ fontSize: 12, background: aiColor + "22", color: aiColor, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                                {t[aiClass as keyof typeof t] as string} {app.aiResult?.score !== undefined ? `(${app.aiResult.score}%)` : ""}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: muted, marginBottom: 4 }}>
                            {lang === "ar" ? app.specNameAr : app.specNameEn} · {degreeOpts.find(d => d.v === app.degree)?.l}
                          </div>
                          {app.submittedAt && (
                            <div style={{ fontSize: 11, color: muted }}>
                              {lang === "ar" ? "تقديم:" : "Submitted:"} {new Date(app.submittedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB")}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                          <button onClick={() => singleAction(app.id, "accepted")}
                            style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{t.approve}</button>
                          <button onClick={() => singleAction(app.id, "under_review")}
                            style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{t.review}</button>
                          <button onClick={() => singleAction(app.id, "rejected")}
                            style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{t.reject}</button>
                          <button onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                            style={{ background: isDark ? "#1e2537" : "#f1f5f9", color: muted, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                            {isExpanded ? "▲" : "▼"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded AI Details */}
                      {isExpanded && app.aiResult && (
                        <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${border}`, background: isDark ? "#111827" : "#f8faff" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4 }}>{t.reasoning}</div>
                              <div style={{ fontSize: 13, color: text }}>{app.aiResult.reasoning}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4 }}>{t.recommendations}</div>
                              <div style={{ fontSize: 13, color: text }}>{app.aiResult.recommendations}</div>
                            </div>
                          </div>
                          {/* Score Bar */}
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: muted }}>{t.aiScore}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: aiColor }}>{app.aiResult.score}%</span>
                            </div>
                            <div style={{ height: 8, background: isDark ? "#1e2537" : "#e2e8f0", borderRadius: 4 }}>
                              <div style={{ height: "100%", width: `${app.aiResult.score}%`, background: aiColor, borderRadius: 4, transition: "width 0.5s" }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── SPECIALIZATIONS TAB ─────────────────────────────────────────── */}
        {tab === "specializations" && (
          <div>
            {profile.status !== "active" && (
              <div style={{ background: isDark ? "#1c1400" : "#fef3c7", color: isDark ? "#fbbf24" : "#92400e", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
                {t.lockedNote}
              </div>
            )}

            {profile.status === "active" && !showAddSpec && !editSpec && (
              <button onClick={() => setShowAddSpec(true)} style={{ marginBottom: 16, background: blue, color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                {t.addSpecBtn}
              </button>
            )}

            {(showAddSpec || editSpec) && (
              <div style={{ background: card, borderRadius: 14, padding: 24, marginBottom: 16, border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: text, margin: "0 0 16px", fontSize: 15 }}>{editSpec ? t.edit : t.addSpec}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ ...lbl, direction: "rtl" }}>{t.specNameAr}</label>
                    <input dir="rtl" value={editSpec ? editSpec.nameAr : specForm.nameAr}
                      onChange={e => editSpec ? setEditSpec({ ...editSpec, nameAr: e.target.value }) : setSpecForm(f => ({ ...f, nameAr: e.target.value }))}
                      style={{ ...inp, direction: "rtl" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.specNameEn}</label>
                    <input dir="ltr" value={editSpec ? editSpec.nameEn : specForm.nameEn}
                      onChange={e => editSpec ? setEditSpec({ ...editSpec, nameEn: e.target.value }) : setSpecForm(f => ({ ...f, nameEn: e.target.value }))}
                      style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.degree}</label>
                    <select value={editSpec ? editSpec.degree : specForm.degree}
                      onChange={e => editSpec ? setEditSpec({ ...editSpec, degree: e.target.value }) : setSpecForm(f => ({ ...f, degree: e.target.value }))}
                      style={{ ...inp }}>
                      {degreeOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>{t.duration}</label>
                    <input dir="ltr" type="number" min={1} max={10}
                      value={editSpec ? editSpec.durationYears : specForm.durationYears}
                      onChange={e => editSpec ? setEditSpec({ ...editSpec, durationYears: Number(e.target.value) }) : setSpecForm(f => ({ ...f, durationYears: Number(e.target.value) }))}
                      style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.fee}</label>
                    <input dir="ltr" type="number"
                      value={editSpec ? (editSpec.tuitionFee ?? "") : specForm.tuitionFee}
                      onChange={e => editSpec ? setEditSpec({ ...editSpec, tuitionFee: e.target.value }) : setSpecForm(f => ({ ...f, tuitionFee: e.target.value }))}
                      style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.currency}</label>
                    <select value={editSpec ? editSpec.currency : specForm.currency}
                      onChange={e => editSpec ? setEditSpec({ ...editSpec, currency: e.target.value }) : setSpecForm(f => ({ ...f, currency: e.target.value }))}
                      style={{ ...inp }}>
                      {["USD", "EUR", "GBP", "SAR", "AED", "EGP", "TRY", "QAR"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={editSpec ? updateSpec : addSpec} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{t.save}</button>
                  <button onClick={() => { setShowAddSpec(false); setEditSpec(null); }} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "9px 20px", cursor: "pointer", color: muted, fontSize: 13 }}>{t.cancel}</button>
                </div>
              </div>
            )}

            {profile.specializations.length === 0 ? (
              <div style={{ background: card, borderRadius: 14, padding: 40, textAlign: "center", color: muted, border: `1px solid ${border}` }}>{t.noSpecs}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {profile.specializations.map(s => (
                  <div key={s.id} style={{ background: card, borderRadius: 14, padding: 20, border: `1px solid ${border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 4 }}>{lang === "ar" ? s.nameAr : s.nameEn}</div>
                    <div style={{ fontSize: 12, color: muted, marginBottom: 12 }}>{lang === "ar" ? s.nameEn : s.nameAr}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <span style={{ fontSize: 11, background: blue + "22", color: blue, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{degreeOpts.find(d => d.v === s.degree)?.l}</span>
                      <span style={{ fontSize: 11, background: isDark ? "#1e2537" : "#f1f5f9", color: muted, padding: "2px 8px", borderRadius: 10 }}>{s.durationYears} {lang === "ar" ? "سنوات" : "yrs"}</span>
                      {s.tuitionFee && <span style={{ fontSize: 11, background: "#10b98122", color: "#10b981", padding: "2px 8px", borderRadius: 10 }}>{Number(s.tuitionFee).toLocaleString()} {s.currency}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditSpec(s)} style={{ flex: 1, background: isDark ? "#1e2537" : "#f1f5f9", color: text, border: "none", borderRadius: 7, padding: "7px", cursor: "pointer", fontSize: 12 }}>{t.edit}</button>
                      <button onClick={() => deleteSpec(s.id)} style={{ flex: 1, background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 7, padding: "7px", cursor: "pointer", fontSize: 12 }}>{t.delete}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── PROFILE TAB ─────────────────────────────────────────────────── */}
        {tab === "profile" && (
          <div style={{ background: card, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: text, fontWeight: 700, fontSize: 17, margin: 0 }}>{t.tabProfile}</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{t.editProfile}</button>
              )}
            </div>
            {editing ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ ...lbl, direction: "rtl" }}>{t.nameAr}</label>
                    <input dir="rtl" value={editForm.nameAr ?? ""} onChange={e => setEditForm(f => ({ ...f, nameAr: e.target.value }))} style={{ ...inp, direction: "rtl" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.nameEn}</label>
                    <input dir="ltr" value={editForm.nameEn ?? ""} onChange={e => setEditForm(f => ({ ...f, nameEn: e.target.value }))} style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.city}</label>
                    <input value={editForm.city ?? ""} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>{t.website}</label>
                    <input dir="ltr" value={editForm.website ?? ""} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.phone}</label>
                    <input dir="ltr" value={editForm.phone ?? ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.logoUrl}</label>
                    <input dir="ltr" value={editForm.logoUrl ?? ""} onChange={e => setEditForm(f => ({ ...f, logoUrl: e.target.value }))} style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>{t.address}</label>
                    <input value={editForm.address ?? ""} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={{ ...lbl, direction: "rtl" }}>{t.descAr}</label>
                    <textarea dir="rtl" rows={3} value={editForm.descriptionAr ?? ""} onChange={e => setEditForm(f => ({ ...f, descriptionAr: e.target.value }))} style={{ ...inp, direction: "rtl", resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.descEn}</label>
                    <textarea dir="ltr" rows={3} value={editForm.descriptionEn ?? ""} onChange={e => setEditForm(f => ({ ...f, descriptionEn: e.target.value }))} style={{ ...inp, direction: "ltr", resize: "vertical" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveProfile} disabled={saving} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                    {saving ? t.saving : t.saveProfile}
                  </button>
                  <button onClick={() => setEditing(false)} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "10px 24px", cursor: "pointer", color: muted, fontSize: 14 }}>{t.cancel}</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {[
                  { label: t.nameAr, value: profile.nameAr, dir: "rtl" as const },
                  { label: t.nameEn, value: profile.nameEn, dir: "ltr" as const },
                  { label: t.city, value: profile.city },
                  { label: t.website, value: profile.website },
                  { label: t.phone, value: profile.phone },
                  { label: t.address, value: profile.address, full: true },
                  { label: t.descAr, value: profile.descriptionAr, dir: "rtl" as const, full: true },
                  { label: t.descEn, value: profile.descriptionEn, dir: "ltr" as const, full: true },
                ].map(f => f.value ? (
                  <div key={f.label} style={f.full ? { gridColumn: "1/-1" } : {}}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 14, color: text, direction: f.dir ?? t.dir }}>{f.value}</div>
                  </div>
                ) : null)}
                {profile.approvedAt && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4 }}>{t.approvedOn}</div>
                    <div style={{ fontSize: 14, color: "#10b981" }}>{new Date(profile.approvedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB")}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
