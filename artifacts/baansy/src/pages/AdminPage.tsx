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
  const [tab, setTab] = useState<"stats" | "ai" | "universities" | "students">("stats");

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

  const loadStudents = async (reset = false) => {
    setStudentLoading(true);
    try {
      const p = reset ? 1 : studentPage;
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
                    onClick={() => { setStudentPage(p => p + 1); loadStudents(false); }}
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
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
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
