import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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

const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];

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
  const [tab, setTab] = useState<"stats" | "ai" | "universities">("stats");

  const [unis, setUnis] = useState<University[]>([]);
  const [uniFilter, setUniFilter] = useState<string>("pending");
  const [uniLoading, setUniLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("home"); return; }
    loadData();
  }, []);

  useEffect(() => {
    if (tab === "universities") loadUniversities();
  }, [tab, uniFilter]);

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
  ] : [];

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

      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "stats", icon: BarChart, label: isAr ? "الإحصائيات" : "Statistics" },
            { id: "universities", icon: GraduationCap, label: isAr ? "الجامعات" : "Universities" },
            { id: "ai", icon: Gear, label: isAr ? "إعدادات الذكاء الاصطناعي" : "AI Settings" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${tab === t.id ? "#2563eb" : border}`, backgroundColor: tab === t.id ? "#2563eb" : cardBg, color: tab === t.id ? "#fff" : textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: font, display: "flex", alignItems: "center", gap: 6 }}>
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </div>

        {tab === "stats" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
              {statCards.map((card, i) => (
                <div key={i} style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 20px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: card.color, marginBottom: 6 }}>{card.value.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: textMuted, fontWeight: 600 }}>{card.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "universities" && (
          <div>
            {/* Filter tabs */}
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
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: inputBg, border: `1px solid ${border}`, borderRadius: 10, color: textMain, fontFamily: font, fontSize: 13, outline: "none" }}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "سرعة الكتابة (ms)" : "Typing Speed (ms)"}</label>
                <input type="number" min={5} max={100} value={localSettings.typingSpeedMs} onChange={e => setLocalSettings(p => ({ ...p, typingSpeedMs: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: inputBg, border: `1px solid ${border}`, borderRadius: 10, color: textMain, fontFamily: font, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "درجة الإبداع (temperature)" : "Temperature"}</label>
                <input type="number" min={0} max={2} step={0.1} value={localSettings.temperature} onChange={e => setLocalSettings(p => ({ ...p, temperature: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: inputBg, border: `1px solid ${border}`, borderRadius: 10, color: textMain, fontFamily: font, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "أقصى عدد رموز" : "Max Tokens"}</label>
                <input type="number" min={100} max={4096} step={50} value={localSettings.maxTokens} onChange={e => setLocalSettings(p => ({ ...p, maxTokens: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: inputBg, border: `1px solid ${border}`, borderRadius: 10, color: textMain, fontFamily: font, fontSize: 13, outline: "none" }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{isAr ? "شخصية الذكاء الاصطناعي (System Prompt)" : "AI Personality (System Prompt)"}</label>
              <textarea value={localSettings.systemPrompt} onChange={e => setLocalSettings(p => ({ ...p, systemPrompt: e.target.value }))} rows={5}
                style={{ width: "100%", padding: "12px", backgroundColor: inputBg, border: `1px solid ${border}`, borderRadius: 10, color: textMain, fontFamily: font, fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.6, direction: isAr ? "rtl" : "ltr" }} />
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
