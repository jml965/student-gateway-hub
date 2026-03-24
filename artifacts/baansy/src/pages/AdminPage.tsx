import { useState, useEffect } from "react";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, BarChart, Gear, Key, Users, Save, ChevL, Check } from "@/components/icons";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

interface AiSettings {
  model: string; systemPrompt: string; temperature: number;
  maxTokens: number; typingSpeedMs: number; hasApiKey: boolean;
}
interface Stats { totalUsers: number; totalSessions: number; totalMessages: number; totalApplications: number; totalDocuments: number; totalUniversities: number; }

interface University {
  id: number; nameAr: string; nameEn: string; country: string; city: string;
  email: string | null; phone: string | null; website: string | null;
  status: string; createdAt: string; specializationCount: number;
}

interface Student {
  id: number; name: string; email: string; phone: string | null;
  country: string | null; status: string; createdAt: string;
  documentCount: number; applicationCount: number;
}

interface DocRecord {
  id: number; userId: number; type: string; fileName: string;
  fileUrl: string; mimeType: string | null; fileSizeBytes: number | null;
  verified: boolean; uploadedAt: string;
}

interface AppRecord {
  id: number; specializationId: number; status: string; notes: string | null;
  submittedAt: string | null; createdAt: string;
  specNameEn: string; specNameAr: string; degree: string;
  uniNameEn: string; uniNameAr: string;
}

interface UniOption { id: number; nameEn: string; nameAr: string; }

interface AppListRecord {
  id: number; status: string; notes: string | null;
  submittedAt: string | null; createdAt: string;
  studentId: number; studentName: string | null; studentEmail: string;
  studentCountry: string | null;
  specNameEn: string; specNameAr: string; degree: string;
  uniNameEn: string; uniNameAr: string;
}

const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
const DOC_TYPES: Record<string, { ar: string; en: string }> = {
  passport: { ar: "جواز سفر", en: "Passport" },
  degree: { ar: "شهادة جامعية", en: "Degree Certificate" },
  transcript: { ar: "كشف درجات", en: "Transcript" },
  language_cert: { ar: "شهادة لغة", en: "Language Certificate" },
  photo: { ar: "صورة شخصية", en: "Photo" },
  bank_statement: { ar: "كشف حساب", en: "Bank Statement" },
  other: { ar: "مستند آخر", en: "Other Document" },
};

export default function AdminPage({ lang, theme, navigate }: { lang: Lang; theme: Theme; navigate: (p: string) => void }) {
  const { user } = useAuth();
  const isDark = theme === "dark";
  const isAr = lang === "ar";
  const font = isAr ? "'Cairo','Inter',sans-serif" : "'Inter','Cairo',sans-serif";
  const bg = isDark ? "#0d1117" : "#f8faff";
  const cardBg = isDark ? "#1e293b" : "#fff";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#0f172a" : "#f8faff";

  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localSettings, setLocalSettings] = useState<Partial<AiSettings>>({});
  const [tab, setTab] = useState<"stats" | "ai" | "universities" | "students" | "applications" | "payments">("stats");

  // University CRM
  const [unis, setUnis] = useState<University[]>([]);
  const [uniFilter, setUniFilter] = useState<string>("pending");
  const [uniLoading, setUniLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  // Student CRM
  const [students, setStudents] = useState<Student[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentQ, setStudentQ] = useState("");
  const [studentStatus, setStudentStatus] = useState("");
  const [studentCountry, setStudentCountry] = useState("");
  const [studentUniversityId, setStudentUniversityId] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [studentHasMore, setStudentHasMore] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<(Student & { documents: DocRecord[]; applications: AppRecord[] }) | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState<number | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [uniOptions, setUniOptions] = useState<UniOption[]>([]);

  // Applications CRM
  const [appStatusCounts, setAppStatusCounts] = useState<Record<string, number>>({});
  const [appList, setAppList] = useState<AppListRecord[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState("");
  const [appUniFilter, setAppUniFilter] = useState("");
  const [appCountryFilter, setAppCountryFilter] = useState("");
  const [appQ, setAppQ] = useState("");
  const [appPage, setAppPage] = useState(1);
  const [appHasMore, setAppHasMore] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);
  // Financial report
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [payTotals, setPayTotals] = useState<{ totalConfirmed: string; totalPending: string; countConfirmed: number; countPending: number } | null>(null);
  const [payStatusFilter, setPayStatusFilter] = useState("");
  const [payChannelFilter, setPayChannelFilter] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [confirmingPayId, setConfirmingPayId] = useState<number | null>(null);
  const [payNotes, setPayNotes] = useState("");

  // University payment settings modal
  const [paySettingsModal, setPaySettingsModal] = useState<number | null>(null);
  const [paySettingsForm, setPaySettingsForm] = useState<Record<string, string>>({});
  const [paySettingsSaving, setPaySettingsSaving] = useState(false);

  // Status change modal with notes + event history
  const [statusModal, setStatusModal] = useState<{ appId: number; current: string } | null>(null);
  const [statusModalNext, setStatusModalNext] = useState("");
  const [statusModalNotes, setStatusModalNotes] = useState("");
  const [appDetailId, setAppDetailId] = useState<number | null>(null);
  const [appDetail, setAppDetail] = useState<(AppListRecord & { events: { id: number; fromStatus: string | null; toStatus: string; notes: string | null; createdAt: string }[] }) | null>(null);
  const [appDetailLoading, setAppDetailLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("home"); return; }
    loadData();
    // Load countries and universities for filters
    fetch(`${API_URL}/universities/countries`).then(r => r.json()).then(setCountries).catch(() => {});
    api.get<{ data: UniOption[] }>("/admin/universities?limit=200").then(r => setUniOptions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "universities") loadUniversities();
  }, [tab, uniFilter]);

  useEffect(() => {
    if (tab === "students") loadStudents(true);
  }, [tab, studentQ, studentStatus, studentCountry, studentUniversityId]);

  useEffect(() => {
    if (tab === "applications") {
      loadApplications(true);
      api.get<{ counts: Record<string, number> }>("/admin/applications/status-counts")
        .then(res => setAppStatusCounts(res.counts))
        .catch(() => {});
    }
  }, [tab, appStatusFilter, appUniFilter, appCountryFilter, appQ]);

  useEffect(() => {
    if (tab === "payments") loadPayments();
  }, [tab, payStatusFilter, payChannelFilter]);

  const loadPayments = async () => {
    setPayLoading(true);
    try {
      const params = new URLSearchParams();
      if (payStatusFilter) params.set("status", payStatusFilter);
      if (payChannelFilter) params.set("channel", payChannelFilter);
      const res = await api.get<{ data: any[]; totals: any }>(`/admin/payments?${params}`);
      setPaymentsList(res.data);
      setPayTotals(res.totals);
    } catch { } finally { setPayLoading(false); }
  };

  const confirmPayment = async (payId: number) => {
    setConfirmingPayId(payId);
    try {
      await api.patch(`/admin/payments/${payId}/confirm`, { notes: payNotes || undefined });
      setPayNotes("");
      await loadPayments();
    } catch { } finally { setConfirmingPayId(null); }
  };

  const savePaySettings = async () => {
    if (!paySettingsModal) return;
    setPaySettingsSaving(true);
    try {
      await api.patch(`/admin/universities/${paySettingsModal}/payment-settings`, paySettingsForm);
      setPaySettingsModal(null);
    } catch { } finally { setPaySettingsSaving(false); }
  };

  const loadData = async () => {
    try {
      const [s, st] = await Promise.all([
        api.get<AiSettings>("/admin/ai-settings"),
        api.get<Stats>("/admin/stats"),
      ]);
      setSettings(s);
      setLocalSettings(s);
      setStats(st);
    } catch { }
  };

  const loadUniversities = async () => {
    setUniLoading(true);
    try {
      const res = await api.get<{ data: University[] }>(`/admin/universities${uniFilter ? `?status=${uniFilter}` : ""}`);
      setUnis(res.data);
    } catch { } finally { setUniLoading(false); }
  };

  const handleUniAction = async (id: number, action: "approve" | "reject" | "suspend") => {
    setActionId(id);
    try {
      await api.patch(`/admin/universities/${id}/${action}`, {});
      await loadUniversities();
    } catch { } finally { setActionId(null); }
  };

  const loadStudents = async (reset = false, pageOverride?: number) => {
    setStudentLoading(true);
    try {
      const p = reset ? 1 : (pageOverride ?? studentPage);
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (studentQ) params.set("q", studentQ);
      if (studentStatus) params.set("status", studentStatus);
      if (studentCountry) params.set("country", studentCountry);
      if (studentUniversityId) params.set("universityId", studentUniversityId);
      const res = await api.get<{ data: Student[]; hasMore: boolean }>(`/admin/students?${params}`);
      if (reset) {
        setStudents(res.data);
        setStudentPage(1);
      } else {
        setStudents(prev => [...prev, ...res.data]);
      }
      setStudentHasMore(res.hasMore);
    } catch { } finally { setStudentLoading(false); }
  };

  const openStudentDetail = async (student: Student) => {
    setStudentDetailLoading(true);
    setSelectedStudent({ ...student, documents: [], applications: [] });
    try {
      const detail = await api.get<Student & { documents: DocRecord[]; applications: AppRecord[] }>(`/admin/students/${student.id}`);
      setSelectedStudent(detail);
    } catch { } finally { setStudentDetailLoading(false); }
  };

  const getDocStoragePath = (fileUrl: string): string => {
    if (fileUrl.startsWith("/objects/")) {
      return `${API_URL}/storage/objects/${fileUrl.slice("/objects/".length)}`;
    }
    if (fileUrl.startsWith("/") && fileUrl.includes("/uploads/")) {
      const uploadsIdx = fileUrl.indexOf("/uploads/");
      return `${API_URL}/storage/objects/uploads/${fileUrl.slice(uploadsIdx + "/uploads/".length)}`;
    }
    return fileUrl;
  };

  const handleAuthDownload = async (fileUrl: string, fileName: string) => {
    const url = getDocStoragePath(fileUrl);
    const token = localStorage.getItem("baansy_token");
    try {
      const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (e) {
      alert(isAr ? "فشل تحميل الملف" : "Failed to download file");
    }
  };

  const handleVerifyDoc = async (docId: number, verified: boolean) => {
    setVerifyingDoc(docId);
    try {
      await api.patch(`/admin/documents/${docId}/verify`, { verified });
      if (selectedStudent) {
        setSelectedStudent(prev => prev ? {
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? { ...d, verified } : d)
        } : null);
      }
    } catch { } finally { setVerifyingDoc(null); }
  };

  const loadApplications = async (reset = false, pageOverride?: number) => {
    setAppLoading(true);
    try {
      const p = reset ? 1 : (pageOverride ?? appPage);
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (appStatusFilter) params.set("status", appStatusFilter);
      if (appUniFilter) params.set("universityId", appUniFilter);
      if (appCountryFilter) params.set("country", appCountryFilter);
      if (appQ) params.set("q", appQ);
      const res = await api.get<{ data: AppListRecord[]; hasMore: boolean }>(`/admin/applications?${params}`);
      if (reset) { setAppList(res.data); setAppPage(1); }
      else { setAppList(prev => [...prev, ...res.data]); }
      setAppHasMore(res.hasMore);
    } catch { } finally { setAppLoading(false); }
  };

  const handleUpdateAppStatus = async (appId: number, status: string, notes?: string) => {
    setUpdatingAppId(appId);
    try {
      await api.patch(`/admin/applications/${appId}/status`, { status, notes: notes || undefined });
      setAppList(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      if (appDetailId === appId) loadAppDetail(appId);
    } catch { } finally { setUpdatingAppId(null); }
  };

  const loadAppDetail = async (id: number) => {
    setAppDetailLoading(true);
    try {
      const detail = await api.get<AppListRecord & { events: { id: number; fromStatus: string | null; toStatus: string; notes: string | null; createdAt: string }[] }>(`/admin/applications/${id}`);
      setAppDetail(detail);
    } catch { } finally { setAppDetailLoading(false); }
  };

  const openAppDetail = (id: number) => {
    setAppDetailId(id);
    setAppDetail(null);
    loadAppDetail(id);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.put<AiSettings>("/admin/ai-settings", localSettings);
      setSettings(updated);
      setLocalSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { } finally { setSaving(false); }
  };

  const statCards = stats ? [
    { label: isAr ? "المستخدمون" : "Total Users", value: stats.totalUsers, color: "#2563eb" },
    { label: isAr ? "جلسات الشات" : "Chat Sessions", value: stats.totalSessions, color: "#7c3aed" },
    { label: isAr ? "الرسائل" : "Messages", value: stats.totalMessages, color: "#0891b2" },
    { label: isAr ? "الطلبات" : "Applications", value: stats.totalApplications, color: "#059669" },
    { label: isAr ? "الوثائق" : "Documents", value: stats.totalDocuments, color: "#dc2626" },
    { label: isAr ? "الجامعات" : "Universities", value: stats.totalUniversities, color: "#d97706" },
  ] : [];

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, borderRadius: 8,
    color: textMain, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: font,
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: font, direction: isAr ? "rtl" : "ltr", color: textMain }}>
      <div style={{ backgroundColor: isDark ? "#0f172a" : "#fff", borderBottom: `1px solid ${border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 16, height: 60 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: textMain }}>Baansy</div>
          <div style={{ fontSize: 10, color: textMuted }}>{isAr ? "لوحة التحكم" : "Admin Dashboard"}</div>
        </div>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: font }}>
          <ChevL size={16} />{isAr ? "العودة للموقع" : "Back to Site"}
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "stats", icon: BarChart, label: isAr ? "الإحصائيات" : "Statistics" },
            { id: "students", icon: Users, label: isAr ? "إدارة الطلاب" : "Students CRM" },
            { id: "applications", icon: ChevL, label: isAr ? "الطلبات" : "Applications" },
            { id: "payments", icon: Key, label: isAr ? "المدفوعات" : "Payments" },
            { id: "universities", icon: GraduationCap, label: isAr ? "الجامعات" : "Universities" },
            { id: "ai", icon: Gear, label: isAr ? "إعدادات الذكاء الاصطناعي" : "AI Settings" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${tab === t.id ? "#2563eb" : border}`, backgroundColor: tab === t.id ? "#2563eb" : cardBg, color: tab === t.id ? "#fff" : textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: font, display: "flex", alignItems: "center", gap: 6 }}>
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </div>

        {/* ─── Stats ─── */}
        {tab === "stats" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
            {statCards.map((card, i) => (
              <div key={i} style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 20px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: card.color, marginBottom: 6 }}>{card.value.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: textMuted, fontWeight: 600 }}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Students CRM ─── */}
        {tab === "students" && (
          <div style={{ display: "flex", gap: 20, height: "calc(100vh - 200px)" }}>
            {/* Students list pane */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              {/* Filters */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                  style={{ ...inputStyle, flex: "1 1 180px" }}
                  placeholder={isAr ? "ابحث باسم الطالب..." : "Search by name..."}
                  value={studentQ}
                  onChange={e => setStudentQ(e.target.value)}
                />
                <select style={{ ...inputStyle, flex: "0 0 130px" }} value={studentStatus} onChange={e => setStudentStatus(e.target.value)}>
                  <option value="">{isAr ? "كل الحالات" : "All Statuses"}</option>
                  <option value="active">{isAr ? "✅ نشط" : "✅ Active"}</option>
                  <option value="suspended">{isAr ? "🚫 موقوف" : "🚫 Suspended"}</option>
                </select>
                <select style={{ ...inputStyle, flex: "0 0 140px" }} value={studentCountry} onChange={e => setStudentCountry(e.target.value)}>
                  <option value="">{isAr ? "كل الدول" : "All Countries"}</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select style={{ ...inputStyle, flex: "1 1 180px" }} value={studentUniversityId} onChange={e => setStudentUniversityId(e.target.value)}>
                  <option value="">{isAr ? "كل الجامعات" : "All Universities"}</option>
                  {uniOptions.map(u => <option key={u.id} value={String(u.id)}>{isAr ? u.nameAr : u.nameEn}</option>)}
                </select>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {studentLoading && students.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
                ) : students.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60, background: cardBg, borderRadius: 14, color: textMuted }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
                    <p>{isAr ? "لا يوجد طلاب مسجلون" : "No students registered yet"}</p>
                  </div>
                ) : (
                  students.map(student => {
                    const isSelected = selectedStudent?.id === student.id;
                    const statusColor = student.status === "active" ? "#10b981" : "#ef4444";
                    return (
                      <div
                        key={student.id}
                        onClick={() => openStudentDetail(student)}
                        style={{
                          background: isSelected ? (isDark ? "#1e3a8a" : "#dbeafe") : cardBg,
                          border: `1px solid ${isSelected ? "#2563eb" : border}`,
                          borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                          boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                          transition: "background 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: textMain }}>{student.name}</div>
                            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{student.email}</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                              {student.country && (
                                <span style={{ fontSize: 11, background: isDark ? "#1e293b" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: 20 }}>
                                  🌍 {student.country}
                                </span>
                              )}
                              <span style={{ fontSize: 11, background: statusColor + "20", color: statusColor, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                                {student.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "موقوف" : "Suspended")}
                              </span>
                              <span style={{ fontSize: 11, color: textMuted }}>
                                📄 {student.documentCount} {isAr ? "وثيقة" : "docs"}
                              </span>
                              <span style={{ fontSize: 11, color: textMuted }}>
                                📋 {student.applicationCount} {isAr ? "طلب" : "apps"}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: textMuted }}>
                            {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {studentHasMore && (
                  <button
                    onClick={() => { const next = studentPage + 1; setStudentPage(next); loadStudents(false, next); }}
                    disabled={studentLoading}
                    style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 600 }}
                  >
                    {isAr ? "تحميل المزيد" : "Load More"}
                  </button>
                )}
              </div>
            </div>

            {/* Student detail pane */}
            {selectedStudent && (
              <div style={{ width: 380, background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20, overflowY: "auto", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: textMain }}>{selectedStudent.name}</h3>
                  <button onClick={() => setSelectedStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 18 }}>✕</button>
                </div>

                <div style={{ fontSize: 12, color: textMuted, marginBottom: 12, lineHeight: 1.8 }}>
                  <div>📧 {selectedStudent.email}</div>
                  {selectedStudent.phone && <div>📞 {selectedStudent.phone}</div>}
                  {selectedStudent.country && <div>🌍 {selectedStudent.country}</div>}
                  <div>📅 {new Date(selectedStudent.createdAt).toLocaleDateString()}</div>
                </div>

                <div style={{ height: 1, background: border, marginBottom: 16 }} />

                <div style={{ fontWeight: 700, fontSize: 13, color: textMain, marginBottom: 10 }}>
                  {isAr ? "الوثائق المرفوعة" : "Uploaded Documents"} ({selectedStudent.documents.length})
                </div>

                {studentDetailLoading ? (
                  <div style={{ textAlign: "center", padding: 20, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
                ) : selectedStudent.documents.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: textMuted, fontSize: 13 }}>
                    {isAr ? "لا توجد وثائق" : "No documents uploaded"}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedStudent.documents.map(doc => {
                      const typeLabel = DOC_TYPES[doc.type]?.[lang] ?? doc.type;
                      const isVerified = doc.verified;
                      return (
                        <div key={doc.id} style={{ background: isDark ? "#0f172a" : "#f8faff", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{typeLabel}</div>
                              <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{doc.fileName}</div>
                              {doc.fileSizeBytes && (
                                <div style={{ fontSize: 11, color: textMuted }}>{(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</div>
                              )}
                            </div>
                            <span style={{ fontSize: 11, background: isVerified ? "#d1fae5" : "#fef3c7", color: isVerified ? "#065f46" : "#92400e", padding: "2px 8px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" }}>
                              {isVerified ? (isAr ? "✓ موثّق" : "✓ Verified") : (isAr ? "⏳ قيد المراجعة" : "⏳ Pending")}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>
                            {new Date(doc.uploadedAt).toLocaleString()}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleAuthDownload(doc.fileUrl, doc.fileName)}
                              style={{ flex: 1, padding: "6px 0", background: isDark ? "#1e293b" : "#f1f5f9", color: "#2563eb", border: `1px solid ${border}`, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                            >
                              ⬇ {isAr ? "تحميل" : "Download"}
                            </button>
                            {!isVerified && (
                              <button
                                onClick={() => handleVerifyDoc(doc.id, true)}
                                disabled={verifyingDoc === doc.id}
                                style={{ flex: 1, padding: "6px 0", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font }}
                              >
                                {isAr ? "توثيق ✓" : "Verify ✓"}
                              </button>
                            )}
                            {isVerified && (
                              <button
                                onClick={() => handleVerifyDoc(doc.id, false)}
                                disabled={verifyingDoc === doc.id}
                                style={{ flex: 1, padding: "6px 0", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font }}
                              >
                                {isAr ? "إلغاء التوثيق" : "Unverify"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Applications section */}
                {!studentDetailLoading && (
                  <>
                    <div style={{ height: 1, background: border, marginTop: 20, marginBottom: 16 }} />
                    <div style={{ fontWeight: 700, fontSize: 13, color: textMain, marginBottom: 10 }}>
                      {isAr ? "الطلبات المقدَّمة" : "Applications"} ({selectedStudent.applications.length})
                    </div>
                    {selectedStudent.applications.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 16, color: textMuted, fontSize: 13 }}>
                        {isAr ? "لا توجد طلبات" : "No applications submitted"}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedStudent.applications.map(app => {
                          const appStatusColors: Record<string, string> = {
                            draft: "#6b7280", submitted: "#3b82f6", documents_pending: "#f59e0b",
                            under_review: "#8b5cf6", preliminary_accepted: "#0891b2",
                            accepted: "#10b981", rejected: "#ef4444", withdrawn: "#6b7280"
                          };
                          const appStatusLabels: Record<string, { ar: string; en: string }> = {
                            draft: { ar: "مسودة", en: "Draft" },
                            submitted: { ar: "مقدَّم", en: "Submitted" },
                            documents_pending: { ar: "بانتظار الوثائق", en: "Docs Pending" },
                            under_review: { ar: "قيد المراجعة", en: "Under Review" },
                            preliminary_accepted: { ar: "قبول مبدئي", en: "Pre-accepted" },
                            accepted: { ar: "مقبول", en: "Accepted" },
                            rejected: { ar: "مرفوض", en: "Rejected" },
                            withdrawn: { ar: "منسحب", en: "Withdrawn" },
                          };
                          const color = appStatusColors[app.status] ?? "#6b7280";
                          return (
                            <div key={app.id} style={{ background: isDark ? "#0f172a" : "#f8faff", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{isAr ? app.uniNameAr : app.uniNameEn}</div>
                              <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{isAr ? app.specNameAr : app.specNameEn} · {app.degree}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                                <span style={{ fontSize: 11, background: color + "20", color, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                                  {appStatusLabels[app.status]?.[lang] ?? app.status}
                                </span>
                                <span style={{ fontSize: 11, color: textMuted }}>{new Date(app.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Applications CRM ─── */}
        {tab === "applications" && (() => {
          const APP_STATUSES: Record<string, { ar: string; en: string; color: string }> = {
            draft: { ar: "مسودة", en: "Draft", color: "#94a3b8" },
            submitted: { ar: "مقدَّم", en: "Submitted", color: "#3b82f6" },
            documents_pending: { ar: "وثائق ناقصة", en: "Docs Pending", color: "#f59e0b" },
            under_review: { ar: "قيد المراجعة", en: "Under Review", color: "#8b5cf6" },
            sent_to_university: { ar: "تم الإرسال للجامعة", en: "Sent to Uni", color: "#0891b2" },
            preliminary_accepted: { ar: "قبول مبدئي", en: "Pre-Accepted", color: "#0ea5e9" },
            payment_pending: { ar: "في انتظار الدفع", en: "Payment Pending", color: "#d97706" },
            accepted: { ar: "مقبول", en: "Accepted", color: "#10b981" },
            rejected: { ar: "مرفوض", en: "Rejected", color: "#ef4444" },
            withdrawn: { ar: "مسحوب", en: "Withdrawn", color: "#64748b" },
          };
          const selStyle = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font, cursor: "pointer" as const };
          const totalApps = Object.values(appStatusCounts).reduce((s, n) => s + n, 0);
          return (
            <div>
              {/* Quick Stats */}
              {totalApps > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                  <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 20px", flex: "1 1 120px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: textMain }}>{totalApps}</div>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{isAr ? "إجمالي الطلبات" : "Total"}</div>
                  </div>
                  {Object.entries(APP_STATUSES).map(([k, v]) => {
                    const n = appStatusCounts[k] ?? 0;
                    if (!n) return null;
                    return (
                      <div
                        key={k}
                        onClick={() => { setAppStatusFilter(appStatusFilter === k ? "" : k); setAppPage(1); }}
                        style={{ background: cardBg, border: `2px solid ${appStatusFilter === k ? v.color : border}`, borderRadius: 12, padding: "12px 16px", flex: "1 1 100px", textAlign: "center", cursor: "pointer", transition: "border .15s" }}
                      >
                        <div style={{ fontSize: 22, fontWeight: 800, color: v.color }}>{n}</div>
                        <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{isAr ? v.ar : v.en}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Filters */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font, flex: "1 1 180px" }}
                  placeholder={isAr ? "ابحث باسم الطالب..." : "Search by student name..."}
                  value={appQ}
                  onChange={e => { setAppQ(e.target.value); setAppPage(1); }}
                />
                <select value={appStatusFilter} onChange={e => { setAppStatusFilter(e.target.value); setAppPage(1); }} style={selStyle}>
                  <option value="">{isAr ? "جميع الحالات" : "All Statuses"}</option>
                  {Object.entries(APP_STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
                  ))}
                </select>
                <select value={appUniFilter} onChange={e => { setAppUniFilter(e.target.value); setAppPage(1); }} style={selStyle}>
                  <option value="">{isAr ? "جميع الجامعات" : "All Universities"}</option>
                  {uniOptions.map(u => <option key={u.id} value={u.id}>{isAr ? u.nameAr : u.nameEn}</option>)}
                </select>
                <select value={appCountryFilter} onChange={e => { setAppCountryFilter(e.target.value); setAppPage(1); }} style={selStyle}>
                  <option value="">{isAr ? "جميع الجنسيات" : "All Nationalities"}</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {(appStatusFilter || appUniFilter || appCountryFilter || appQ) && (
                  <button onClick={() => { setAppStatusFilter(""); setAppUniFilter(""); setAppCountryFilter(""); setAppQ(""); }} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: textMuted, cursor: "pointer", fontSize: 12, fontFamily: font }}>
                    {isAr ? "إعادة تعيين" : "Clear Filters"}
                  </button>
                )}
              </div>

              {/* Application rows + detail panel */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {appLoading && appList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
                  ) : appList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: textMuted }}>{isAr ? "لا توجد طلبات" : "No applications found"}</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {appList.map(app => {
                        const st = APP_STATUSES[app.status] ?? { ar: app.status, en: app.status, color: "#94a3b8" };
                        const isSelected = appDetailId === app.id;
                        return (
                          <div key={app.id} onClick={() => openAppDetail(app.id)} style={{ background: isSelected ? (isDark ? "#1e3a5f" : "#eff6ff") : cardBg, border: `1px solid ${isSelected ? "#2563eb" : border}`, borderRadius: 12, padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", cursor: "pointer", transition: "all .15s" }}>
                            <div style={{ flex: "1 1 180px" }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: textMain }}>{app.studentName || app.studentEmail}</div>
                              <div style={{ fontSize: 12, color: textMuted }}>{app.studentEmail}{app.studentCountry ? ` · ${app.studentCountry}` : ""}</div>
                            </div>
                            <div style={{ flex: "1 1 180px" }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: textMain }}>{isAr ? app.uniNameAr : app.uniNameEn}</div>
                              <div style={{ fontSize: 12, color: textMuted }}>{isAr ? app.specNameAr : app.specNameEn} · {app.degree}</div>
                            </div>
                            <div style={{ flex: "0 0 auto", fontSize: 11, color: "#fff", background: st.color, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                              {isAr ? st.ar : st.en}
                            </div>
                            <div onClick={e => e.stopPropagation()} style={{ flex: "0 0 auto" }}>
                              <button
                                onClick={() => { setStatusModal({ appId: app.id, current: app.status }); setStatusModalNext(app.status); setStatusModalNotes(""); }}
                                style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? "#334155" : "#f1f5f9", color: textMain, cursor: "pointer", fontSize: 12, fontFamily: font, fontWeight: 600 }}
                              >
                                {isAr ? "تغيير الحالة" : "Change Status"}
                              </button>
                            </div>
                            <div style={{ fontSize: 11, color: textMuted, flex: "0 0 auto" }}>
                              {new Date(app.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                      {appHasMore && (
                        <button
                          onClick={() => { const next = appPage + 1; setAppPage(next); loadApplications(false, next); }}
                          disabled={appLoading}
                          style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 600, alignSelf: "center", marginTop: 8 }}
                        >
                          {isAr ? "تحميل المزيد" : "Load More"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Detail / History panel */}
                {appDetailId && (
                  <div style={{ width: 320, background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 20, alignSelf: "flex-start", flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>{isAr ? "سجل الطلب" : "Application History"}</div>
                      <button onClick={() => { setAppDetailId(null); setAppDetail(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                    {appDetailLoading ? (
                      <div style={{ color: textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
                    ) : appDetail ? (
                      <>
                        <div style={{ fontSize: 13, color: textMuted, marginBottom: 16 }}>
                          <strong style={{ color: textMain }}>{appDetail.studentName || appDetail.studentEmail}</strong><br />
                          {appDetail.uniNameEn} — {appDetail.specNameEn}
                        </div>
                        {appDetail.events.length === 0 ? (
                          <div style={{ color: textMuted, fontSize: 12 }}>{isAr ? "لا توجد أحداث" : "No events yet"}</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {appDetail.events.map((ev, i) => {
                              const toSt = APP_STATUSES[ev.toStatus] ?? { color: "#94a3b8", en: ev.toStatus, ar: ev.toStatus };
                              return (
                                <div key={ev.id} style={{ position: "relative", paddingInlineStart: 20 }}>
                                  <div style={{ position: "absolute", insetInlineStart: 0, top: 5, width: 10, height: 10, borderRadius: "50%", background: toSt.color, border: `2px solid ${border}` }} />
                                  {i < appDetail.events.length - 1 && (
                                    <div style={{ position: "absolute", insetInlineStart: 4, top: 18, bottom: -8, width: 2, background: border }} />
                                  )}
                                  <div style={{ fontSize: 12, fontWeight: 700, color: toSt.color }}>{isAr ? toSt.ar : toSt.en}</div>
                                  {ev.notes && <div style={{ fontSize: 11, color: textMuted, marginTop: 2, fontStyle: "italic" }}>{ev.notes}</div>}
                                  <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{new Date(ev.createdAt).toLocaleString()}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ─── Financial Report ─── */}
        {tab === "payments" && (
          <div>
            {/* Summary cards */}
            {payTotals && (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 24px", flex: "1 1 140px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>${parseFloat(payTotals.totalConfirmed).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{isAr ? "إجمالي المؤكد" : "Confirmed Revenue"}</div>
                </div>
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 24px", flex: "1 1 140px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>${parseFloat(payTotals.totalPending).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{isAr ? "إجمالي المعلق" : "Pending Revenue"}</div>
                </div>
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 24px", flex: "1 1 140px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{payTotals.countConfirmed}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{isAr ? "دفعات مؤكدة" : "Confirmed Payments"}</div>
                </div>
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 24px", flex: "1 1 140px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{payTotals.countPending}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{isAr ? "دفعات معلقة" : "Pending Payments"}</div>
                </div>
              </div>
            )}
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <select value={payStatusFilter} onChange={e => setPayStatusFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font }}>
                <option value="">{isAr ? "جميع الحالات" : "All Statuses"}</option>
                <option value="pending">{isAr ? "معلق" : "Pending"}</option>
                <option value="confirmed">{isAr ? "مؤكد" : "Confirmed"}</option>
                <option value="failed">{isAr ? "فاشل" : "Failed"}</option>
              </select>
              <select value={payChannelFilter} onChange={e => setPayChannelFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font }}>
                <option value="">{isAr ? "جميع القنوات" : "All Channels"}</option>
                <option value="bank">{isAr ? "تحويل بنكي" : "Bank Transfer"}</option>
                <option value="stripe">{isAr ? "بطاقة إلكترونية" : "Card (Stripe)"}</option>
              </select>
              <button onClick={loadPayments} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`, background: cardBg, color: textMuted, cursor: "pointer", fontSize: 13, fontFamily: font }}>
                {isAr ? "تحديث" : "Refresh"}
              </button>
            </div>
            {payLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : paymentsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: textMuted, background: cardBg, borderRadius: 12, border: `1px solid ${border}` }}>
                {isAr ? "لا توجد مدفوعات" : "No payments found"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {paymentsList.map(pay => {
                  const isConfirmed = pay.status === "confirmed";
                  const isBankPending = pay.channel === "bank" && pay.status === "pending";
                  return (
                    <div key={pay.id} style={{ background: cardBg, border: `1px solid ${isConfirmed ? "#6ee7b7" : border}`, borderRadius: 12, padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: "1 1 180px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: textMain }}>{pay.studentName || pay.studentEmail}</div>
                        <div style={{ fontSize: 12, color: textMuted }}>{pay.studentEmail}</div>
                      </div>
                      <div style={{ flex: "1 1 160px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: textMain }}>{isAr ? pay.uniNameAr : pay.uniNameEn}</div>
                        <div style={{ fontSize: 12, color: textMuted }}>
                          {pay.channel === "bank" ? (isAr ? "تحويل بنكي" : "Bank Transfer") : (isAr ? "بطاقة إلكترونية" : "Card (Stripe)")}
                        </div>
                      </div>
                      <div style={{ flex: "0 0 auto", textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#2563eb" }}>{parseFloat(pay.amount).toLocaleString()} {pay.currency}</div>
                        <div style={{ fontSize: 11, color: isConfirmed ? "#10b981" : pay.status === "failed" ? "#ef4444" : "#f59e0b", fontWeight: 700, marginTop: 2 }}>
                          {isConfirmed ? (isAr ? "مؤكد" : "Confirmed") : pay.status === "failed" ? (isAr ? "فاشل" : "Failed") : (isAr ? "معلق" : "Pending")}
                        </div>
                      </div>
                      {isBankPending && (
                        <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 6 }}>
                          <input
                            placeholder={isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}
                            value={confirmingPayId === pay.id ? payNotes : ""}
                            onChange={e => setPayNotes(e.target.value)}
                            style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 12, fontFamily: font, width: "100%", boxSizing: "border-box" as const }}
                          />
                          <button
                            onClick={() => confirmPayment(pay.id)}
                            disabled={confirmingPayId === pay.id}
                            style={{ padding: "8px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: font, opacity: confirmingPayId === pay.id ? 0.6 : 1 }}
                          >
                            {confirmingPayId === pay.id ? "..." : (isAr ? "تأكيد الاستلام ✓" : "Confirm Payment ✓")}
                          </button>
                        </div>
                      )}
                      {isConfirmed && pay.confirmedAt && (
                        <div style={{ fontSize: 11, color: textMuted, flex: "0 0 auto" }}>
                          {new Date(pay.confirmedAt).toLocaleDateString()}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: textMuted, flex: "0 0 auto" }}>
                        #{pay.applicationId}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── University Payment Settings Modal ─── */}
        {paySettingsModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }} onClick={() => setPaySettingsModal(null)}>
            <div style={{ background: cardBg, borderRadius: 16, padding: 28, width: 460, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 700, fontSize: 17, color: textMain, marginBottom: 20 }}>{isAr ? "إعدادات الدفع" : "Payment Settings"}</div>
              {[
                { key: "paymentMode", label: isAr ? "طريقة الدفع" : "Payment Mode", type: "select", options: [["platform", isAr ? "عبر المنصة (Stripe)" : "Via Platform (Stripe)"], ["direct", isAr ? "تحويل بنكي مباشر" : "Direct Bank Transfer"]] },
                { key: "bankBeneficiary", label: isAr ? "اسم المستفيد" : "Beneficiary Name", type: "text" },
                { key: "bankName", label: isAr ? "اسم البنك" : "Bank Name", type: "text" },
                { key: "bankIban", label: "IBAN", type: "text" },
                { key: "bankBranch", label: isAr ? "الفرع" : "Branch", type: "text" },
                { key: "bankInstructionsAr", label: isAr ? "تعليمات الدفع (عربي)" : "Payment Instructions (AR)", type: "textarea" },
                { key: "bankInstructionsEn", label: isAr ? "تعليمات الدفع (إنجليزي)" : "Payment Instructions (EN)", type: "textarea" },
                { key: "stripeAccountId", label: isAr ? "معرّف حساب Stripe (اختياري للـ Connect)" : "Stripe Account ID (optional, for Connect)", type: "text" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 5 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select value={paySettingsForm[f.key] ?? ""} onChange={e => setPaySettingsForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font }}>
                      {(f.options as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea value={paySettingsForm[f.key] ?? ""} onChange={e => setPaySettingsForm(prev => ({ ...prev, [f.key]: e.target.value }))} rows={3} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font, resize: "vertical" as const, boxSizing: "border-box" as const }} />
                  ) : (
                    <input value={paySettingsForm[f.key] ?? ""} onChange={e => setPaySettingsForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font, boxSizing: "border-box" as const }} />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={savePaySettings} disabled={paySettingsSaving} style={{ flex: 1, padding: "11px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: font, opacity: paySettingsSaving ? 0.7 : 1 }}>
                  {paySettingsSaving ? "..." : (isAr ? "حفظ الإعدادات" : "Save Settings")}
                </button>
                <button onClick={() => setPaySettingsModal(null)} style={{ padding: "11px 20px", background: "transparent", border: `1px solid ${border}`, borderRadius: 10, color: textMuted, cursor: "pointer", fontSize: 14, fontFamily: font }}>
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status change modal */}
        {statusModal && (() => {
          const APP_STATUSES_M: Record<string, { ar: string; en: string; color: string }> = {
            draft: { ar: "مسودة", en: "Draft", color: "#94a3b8" },
            submitted: { ar: "مقدَّم", en: "Submitted", color: "#3b82f6" },
            documents_pending: { ar: "وثائق ناقصة", en: "Docs Pending", color: "#f59e0b" },
            under_review: { ar: "قيد المراجعة", en: "Under Review", color: "#8b5cf6" },
            sent_to_university: { ar: "تم الإرسال للجامعة", en: "Sent to University", color: "#0891b2" },
            preliminary_accepted: { ar: "قبول مبدئي", en: "Pre-Accepted", color: "#0ea5e9" },
            payment_pending: { ar: "في انتظار الدفع", en: "Payment Pending", color: "#d97706" },
            accepted: { ar: "مقبول", en: "Accepted", color: "#10b981" },
            rejected: { ar: "مرفوض", en: "Rejected", color: "#ef4444" },
            withdrawn: { ar: "مسحوب", en: "Withdrawn", color: "#64748b" },
          };
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setStatusModal(null)}>
              <div style={{ background: cardBg, borderRadius: 16, padding: 28, width: 380, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 700, fontSize: 17, color: textMain, marginBottom: 18 }}>{isAr ? "تغيير حالة الطلب" : "Change Application Status"}</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 6 }}>{isAr ? "الحالة الجديدة" : "New Status"}</label>
                  <select value={statusModalNext} onChange={e => setStatusModalNext(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 14, fontFamily: font }}>
                    {Object.entries(APP_STATUSES_M).map(([k, v]) => (
                      <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: textMuted, display: "block", marginBottom: 6 }}>{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
                  <textarea
                    value={statusModalNotes}
                    onChange={e => setStatusModalNotes(e.target.value)}
                    placeholder={isAr ? "أضف ملاحظة للطالب..." : "Add a note for the student..."}
                    rows={3}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 13, fontFamily: font, resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setStatusModal(null)} style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: textMuted, cursor: "pointer", fontFamily: font, fontSize: 13 }}>
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={async () => {
                      await handleUpdateAppStatus(statusModal.appId, statusModalNext, statusModalNotes);
                      setStatusModal(null);
                    }}
                    disabled={updatingAppId === statusModal.appId}
                    style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 700 }}
                  >
                    {updatingAppId === statusModal.appId ? "..." : (isAr ? "تأكيد" : "Confirm")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── Universities ─── */}
        {tab === "universities" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[
                { v: "pending", l: isAr ? "⏳ قيد المراجعة" : "⏳ Pending" },
                { v: "active", l: isAr ? "✅ مفعّلة" : "✅ Active" },
                { v: "rejected", l: isAr ? "❌ مرفوضة" : "❌ Rejected" },
                { v: "", l: isAr ? "الكل" : "All" },
              ].map(f => (
                <button key={f.v} onClick={() => setUniFilter(f.v)} style={{
                  padding: "6px 14px", borderRadius: 8, border: `1px solid ${uniFilter === f.v ? "#2563eb" : border}`,
                  background: uniFilter === f.v ? "#2563eb" : cardBg, color: uniFilter === f.v ? "#fff" : textMuted,
                  cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font,
                }}>
                  {f.l}
                </button>
              ))}
            </div>

            {uniLoading ? (
              <div style={{ textAlign: "center", color: textMuted, padding: 40 }}>{isAr ? "جارٍ التحميل..." : "Loading..."}</div>
            ) : unis.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: textMuted, background: cardBg, borderRadius: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
                <p>{isAr ? "لا توجد جامعات في هذه الفئة" : "No universities in this category"}</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {unis.map(uni => {
                  const statusColor = { pending: "#f59e0b", active: "#10b981", rejected: "#ef4444", inactive: "#6b7280" }[uni.status] ?? "#6b7280";
                  return (
                    <div key={uni.id} style={{ background: cardBg, borderRadius: 14, padding: 20, border: `1px solid ${border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: textMain, marginBottom: 4 }}>
                            {isAr ? uni.nameAr : uni.nameEn}
                          </div>
                          <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>
                            🌍 {uni.country} · {uni.city}
                            {uni.email && <> · 📧 {uni.email}</>}
                            {uni.website && <> · <a href={uni.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>{uni.website}</a></>}
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, background: statusColor + "20", color: statusColor, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                              {uni.status}
                            </span>
                            <span style={{ fontSize: 11, background: isDark ? "#1e293b" : "#f1f5f9", color: textMuted, padding: "3px 10px", borderRadius: 20 }}>
                              {uni.specializationCount} {isAr ? "تخصص" : "specializations"}
                            </span>
                            <span style={{ fontSize: 11, color: textMuted }}>
                              {new Date(uni.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                          <button onClick={() => {
                            setPaySettingsForm({
                              paymentMode: (uni as any).paymentMode || "direct",
                              bankBeneficiary: (uni as any).bankBeneficiary || "",
                              bankName: (uni as any).bankName || "",
                              bankIban: (uni as any).bankIban || "",
                              bankBranch: (uni as any).bankBranch || "",
                              bankInstructionsAr: (uni as any).bankInstructionsAr || "",
                              bankInstructionsEn: (uni as any).bankInstructionsEn || "",
                              stripeAccountId: (uni as any).stripeAccountId || "",
                            });
                            setPaySettingsModal(uni.id);
                          }} style={{ background: isDark ? "#1e293b" : "#f1f5f9", color: "#2563eb", border: `1px solid #2563eb44`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font }}>
                            {isAr ? "⚙ إعدادات الدفع" : "⚙ Pay Settings"}
                          </button>
                          {uni.status === "pending" && (
                            <>
                              <button onClick={() => handleUniAction(uni.id, "approve")} disabled={actionId === uni.id} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: font }}>
                                {isAr ? "موافقة" : "Approve"}
                              </button>
                              <button onClick={() => handleUniAction(uni.id, "reject")} disabled={actionId === uni.id} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: font }}>
                                {isAr ? "رفض" : "Reject"}
                              </button>
                            </>
                          )}
                          {uni.status === "active" && (
                            <button onClick={() => handleUniAction(uni.id, "suspend")} disabled={actionId === uni.id} style={{ background: isDark ? "#1e293b" : "#f1f5f9", color: textMuted, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontFamily: font }}>
                              {isAr ? "إيقاف" : "Suspend"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── AI Settings ─── */}
        {tab === "ai" && settings && (
          <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <Gear size={20} color="#2563eb" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: textMain, margin: 0 }}>{isAr ? "إعدادات الذكاء الاصطناعي" : "AI Settings"}</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", backgroundColor: localSettings.hasApiKey ? (isDark ? "#0f2a1a" : "#f0fdf4") : (isDark ? "#2a1515" : "#fef2f2"), border: `1px solid ${localSettings.hasApiKey ? "#86efac" : "#fecaca"}`, borderRadius: 12, marginBottom: 24 }}>
              <Key size={16} color={localSettings.hasApiKey ? "#16a34a" : "#dc2626"} />
              <span style={{ fontSize: 13, color: localSettings.hasApiKey ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                {localSettings.hasApiKey
                  ? (isAr ? "✓ مفتاح OpenAI API مفعّل" : "✓ OpenAI API key is configured")
                  : (isAr ? "⚠ مفتاح OpenAI API غير مضبوط" : "⚠ OpenAI API key is not configured")}
              </span>
              {!localSettings.hasApiKey && (
                <span style={{ fontSize: 11, color: textMuted, marginInlineStart: "auto" }}>
                  {isAr ? "أضفه من متغيرات البيئة: OPENAI_API_KEY" : "Add OPENAI_API_KEY to environment secrets"}
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "النموذج" : "Model"}</label>
                <select value={localSettings.model} onChange={e => setLocalSettings(p => ({ ...p, model: e.target.value }))}
                  style={{ ...inputStyle, width: "100%" }}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "سرعة الكتابة (ms)" : "Typing Speed (ms)"}</label>
                <input type="number" min={5} max={100} value={localSettings.typingSpeedMs} onChange={e => setLocalSettings(p => ({ ...p, typingSpeedMs: Number(e.target.value) }))}
                  style={{ ...inputStyle, width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "درجة الإبداع (temperature)" : "Temperature"}</label>
                <input type="number" min={0} max={2} step={0.1} value={localSettings.temperature} onChange={e => setLocalSettings(p => ({ ...p, temperature: Number(e.target.value) }))}
                  style={{ ...inputStyle, width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "أقصى عدد رموز" : "Max Tokens"}</label>
                <input type="number" min={100} max={4096} step={50} value={localSettings.maxTokens} onChange={e => setLocalSettings(p => ({ ...p, maxTokens: Number(e.target.value) }))}
                  style={{ ...inputStyle, width: "100%" }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "شخصية الذكاء الاصطناعي (System Prompt)" : "AI Personality (System Prompt)"}</label>
              <textarea value={localSettings.systemPrompt} onChange={e => setLocalSettings(p => ({ ...p, systemPrompt: e.target.value }))} rows={5}
                style={{ ...inputStyle, width: "100%", resize: "vertical", lineHeight: 1.6, direction: isAr ? "rtl" : "ltr" }} />
              <p style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>
                {isAr ? "هذا النص يحدد شخصية وأسلوب الذكاء الاصطناعي. الذكاء يجيب بلغة المستخدم دائماً." : "This text defines the AI's personality and style. The AI always responds in the user's language."}
              </p>
            </div>

            <button onClick={save} disabled={saving} style={{ padding: "12px 24px", background: saved ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer", fontFamily: font, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(37,99,235,.3)" }}>
              {saved ? <><Check size={16} />{isAr ? "تم الحفظ!" : "Saved!"}</> : saving ? (isAr ? "جاري الحفظ..." : "Saving...") : <><Save size={16} />{isAr ? "حفظ الإعدادات" : "Save Settings"}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
