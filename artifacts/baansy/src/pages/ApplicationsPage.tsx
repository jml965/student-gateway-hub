import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, ChevL } from "@/components/icons";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

interface Props { lang: Lang; theme: Theme; navigate: (p: string) => void; }

const STATUS_CONFIG: Record<string, { ar: string; en: string; color: string; step: number }> = {
  draft:                { ar: "مسودة", en: "Draft", color: "#94a3b8", step: 0 },
  submitted:            { ar: "مقدَّم", en: "Submitted", color: "#3b82f6", step: 1 },
  documents_pending:    { ar: "وثائق ناقصة", en: "Docs Needed", color: "#f59e0b", step: 1 },
  under_review:         { ar: "قيد المراجعة", en: "Under Review", color: "#8b5cf6", step: 2 },
  preliminary_accepted: { ar: "قبول مبدئي", en: "Pre-Accepted", color: "#0ea5e9", step: 3 },
  accepted:             { ar: "مقبول", en: "Accepted", color: "#10b981", step: 5 },
  rejected:             { ar: "مرفوض", en: "Rejected", color: "#ef4444", step: -1 },
  withdrawn:            { ar: "مسحوب", en: "Withdrawn", color: "#64748b", step: -1 },
};

const STEPS = {
  ar: ["الوثائق", "المراجعة", "الجامعة", "قبول مبدئي", "الدفع", "قبول نهائي"],
  en: ["Documents", "Review", "University", "Pre-Accepted", "Payment", "Accepted"],
};

interface AppRecord {
  id: number;
  status: string;
  notes: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  specNameEn: string; specNameAr: string;
  degree: string; tuitionFee: string | null; currency: string | null;
  uniNameEn: string; uniNameAr: string;
  uniCountry: string; uniCity: string;
  uniLogoUrl: string | null;
}

interface AppDetail extends AppRecord {
  requirementsJson: unknown;
  universityId: number;
  events: { id: number; fromStatus: string | null; toStatus: string; notes: string | null; createdAt: string }[];
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function ApplicationsPage({ lang, theme, navigate }: Props) {
  const { user } = useAuth();
  const isDark = theme === "dark";
  const isAr = lang === "ar";
  const font = isAr ? "'Cairo','Inter',sans-serif" : "'Inter','Cairo',sans-serif";

  const bg = isDark ? "#0d1117" : "#f8faff";
  const cardBg = isDark ? "#1e293b" : "#fff";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : "#e2e8f0";

  const [tab, setTab] = useState<"applications" | "notifications">("applications");
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<AppDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  const steps = STEPS[isAr ? "ar" : "en"];

  useEffect(() => {
    if (!user) { navigate("login"); return; }
    loadApps();
  }, [user]);

  useEffect(() => {
    if (tab === "notifications") loadNotifications();
  }, [tab]);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await api.get<AppRecord[]>("/applications");
      setApps(data);
    } catch { } finally { setLoading(false); }
  };

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await api.get<Notification[]>("/notifications");
      setNotifications(data);
    } catch { } finally { setNotifLoading(false); }
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setSelectedApp(null);
    try {
      const detail = await api.get<AppDetail>(`/applications/${id}`);
      setSelectedApp(detail);
    } catch { } finally { setDetailLoading(false); }
  };

  const submitApp = async (id: number) => {
    setSubmitting(id);
    setSubmitError(null);
    try {
      await api.post(`/applications/${id}/submit`, {});
      await loadApps();
      if (selectedApp?.id === id) await openDetail(id);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("no_documents") || msg.includes("document"))
        setSubmitError(isAr ? "يرجى رفع وثيقة واحدة على الأقل قبل التقديم" : "Please upload at least one document before submitting");
      else
        setSubmitError(isAr ? "حدث خطأ أثناء التقديم" : "Failed to submit application");
    } finally { setSubmitting(null); }
  };

  const withdrawApp = async (id: number) => {
    if (!confirm(isAr ? "هل أنت متأكد من سحب هذا الطلب؟" : "Are you sure you want to withdraw this application?")) return;
    setWithdrawing(id);
    try {
      await api.delete(`/applications/${id}`);
      await loadApps();
      if (selectedApp?.id === id) setSelectedApp(null);
    } catch { } finally { setWithdrawing(null); }
  };

  const markRead = async (id: number) => {
    setMarkingRead(id);
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { } finally { setMarkingRead(null); }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all", {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { }
  };

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const CongratulationsScreen = ({ app }: { app: AppDetail }) => (
    <div style={{ textAlign: "center", padding: "40px 20px", background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 20, border: "2px solid #10b981" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#065f46", marginBottom: 8 }}>
        {isAr ? "مبروك! قبول مبدئي" : "Congratulations! Preliminary Accepted"}
      </div>
      <div style={{ fontSize: 15, color: "#047857", marginBottom: 20 }}>
        {isAr
          ? `تم قبولك مبدئياً في ${app.uniNameAr} — ${app.specNameAr}`
          : `You've been preliminarily accepted to ${app.uniNameEn} — ${app.specNameEn}`}
      </div>
      {app.notes && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", textAlign: isAr ? "right" : "left", marginBottom: 20, border: "1px solid #a7f3d0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 6 }}>{isAr ? "ملاحظة المشرف" : "Advisor Note"}</div>
          <div style={{ fontSize: 14, color: "#1e293b" }}>{app.notes}</div>
        </div>
      )}
      <div style={{ fontSize: 14, color: "#047857", marginBottom: 24 }}>
        {isAr ? "الخطوة التالية: إتمام عملية الدفع لتأكيد القبول النهائي" : "Next step: Complete payment to confirm final acceptance"}
      </div>
      <button
        onClick={() => navigate("home")}
        style={{ background: "#10b981", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: font }}
      >
        {isAr ? "تواصل مع المشرف →" : "Contact Advisor →"}
      </button>
    </div>
  );

  const Stepper = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status];
    const activeStep = cfg?.step ?? 0;
    const isRejected = status === "rejected" || status === "withdrawn";

    if (isRejected) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>
          <span style={{ fontSize: 20 }}>❌</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
            {isAr ? (status === "rejected" ? "مرفوض" : "مسحوب") : (status === "rejected" ? "Rejected" : "Withdrawn")}
          </span>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "8px 0" }}>
        {steps.map((label, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          const color = active ? cfg?.color ?? "#2563eb" : done ? "#10b981" : (isDark ? "#334155" : "#e2e8f0");
          const textColor = active || done ? "#fff" : textMuted;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: textColor, transition: "all .3s", boxShadow: active ? `0 0 0 4px ${color}30` : "none" }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: 10, marginTop: 4, fontWeight: active ? 700 : 400, color: active ? cfg?.color ?? "#2563eb" : done ? "#10b981" : textMuted, textAlign: "center", whiteSpace: "nowrap" }}>
                  {label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ height: 2, width: 28, background: done ? "#10b981" : (isDark ? "#334155" : "#e2e8f0"), marginBottom: 20, flexShrink: 0, transition: "background .3s" }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: font, direction: isAr ? "rtl" : "ltr", color: textMain }}>
      {/* Header */}
      <div style={{ backgroundColor: isDark ? "#0f172a" : "#fff", borderBottom: `1px solid ${border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 14, height: 60, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: textMain }}>Baansy</div>
          <div style={{ fontSize: 10, color: textMuted }}>{isAr ? "طلباتي الجامعية" : "My University Applications"}</div>
        </div>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: font }}>
          <ChevL size={16} />{isAr ? "الرئيسية" : "Home"}
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button onClick={() => setTab("applications")} style={{ padding: "8px 20px", borderRadius: 10, border: `1px solid ${tab === "applications" ? "#2563eb" : border}`, background: tab === "applications" ? "#2563eb" : cardBg, color: tab === "applications" ? "#fff" : textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: font }}>
            {isAr ? "طلباتي" : "Applications"} {apps.length > 0 && `(${apps.length})`}
          </button>
          <button onClick={() => setTab("notifications")} style={{ padding: "8px 20px", borderRadius: 10, border: `1px solid ${tab === "notifications" ? "#2563eb" : border}`, background: tab === "notifications" ? "#2563eb" : cardBg, color: tab === "notifications" ? "#fff" : textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: font, position: "relative" }}>
            {isAr ? "الإشعارات" : "Notifications"}
            {unreadNotifs > 0 && (
              <span style={{ marginInlineStart: 6, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{unreadNotifs}</span>
            )}
          </button>
        </div>

        {/* ── Applications Tab ── */}
        {tab === "applications" && (
          <div style={{ display: "flex", gap: 20 }}>
            {/* Application list */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
              ) : apps.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: textMuted, background: cardBg, borderRadius: 16, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{isAr ? "لا توجد طلبات بعد" : "No applications yet"}</div>
                  <div style={{ fontSize: 14, marginBottom: 20, color: textMuted }}>{isAr ? "ابدأ باستكشاف الجامعات وتقديم طلبك" : "Start by exploring universities and submitting an application"}</div>
                  <button onClick={() => navigate("universities")} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
                    {isAr ? "استكشف الجامعات" : "Explore Universities"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {apps.map(app => {
                    const cfg = STATUS_CONFIG[app.status] ?? { ar: app.status, en: app.status, color: "#94a3b8", step: 0 };
                    const isSelected = selectedApp?.id === app.id;
                    const isPrelim = app.status === "preliminary_accepted";
                    return (
                      <div
                        key={app.id}
                        onClick={() => openDetail(app.id)}
                        style={{ background: isSelected ? (isDark ? "#1e3a5f" : "#eff6ff") : (isPrelim ? (isDark ? "#064e3b30" : "#f0fdf4") : cardBg), border: `1px solid ${isSelected ? "#2563eb" : isPrelim ? "#10b981" : border}`, borderRadius: 14, padding: 18, cursor: "pointer", transition: "all .15s", position: "relative" }}
                      >
                        {isPrelim && (
                          <div style={{ position: "absolute", top: 12, insetInlineEnd: 12, background: "#10b981", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>🎉 {isAr ? "قبول مبدئي!" : "Pre-Accepted!"}</div>
                        )}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
                          {app.uniLogoUrl ? (
                            <img src={app.uniLogoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <GraduationCap size={22} color="#fff" />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: textMain, marginBottom: 2 }}>{isAr ? app.uniNameAr : app.uniNameEn}</div>
                            <div style={{ fontSize: 13, color: textMuted }}>{isAr ? app.specNameAr : app.specNameEn} · {app.degree}</div>
                            <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{app.uniCountry} · {app.uniCity}</div>
                          </div>
                          <div style={{ flexShrink: 0, fontSize: 11, color: "#fff", background: cfg.color, padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
                            {isAr ? cfg.ar : cfg.en}
                          </div>
                        </div>
                        <Stepper status={app.status} />
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                          {app.status === "draft" && (
                            <button
                              onClick={e => { e.stopPropagation(); submitApp(app.id); }}
                              disabled={submitting === app.id}
                              style={{ padding: "7px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: font }}
                            >
                              {submitting === app.id ? "..." : (isAr ? "تقديم الطلب" : "Submit Application")}
                            </button>
                          )}
                          {!["accepted", "withdrawn", "rejected"].includes(app.status) && (
                            <button
                              onClick={e => { e.stopPropagation(); withdrawApp(app.id); }}
                              disabled={withdrawing === app.id}
                              style={{ padding: "7px 16px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}
                            >
                              {withdrawing === app.id ? "..." : (isAr ? "سحب الطلب" : "Withdraw")}
                            </button>
                          )}
                        </div>
                        {submitError && submitting === null && selectedApp?.id === app.id && (
                          <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>{submitError}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail panel */}
            {(selectedApp || detailLoading) && (
              <div style={{ width: 340, background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 22, alignSelf: "flex-start", flexShrink: 0, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>{isAr ? "تفاصيل الطلب" : "Application Detail"}</div>
                  <button onClick={() => setSelectedApp(null)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
                </div>

                {detailLoading ? (
                  <div style={{ textAlign: "center", padding: 30, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
                ) : selectedApp ? (
                  <>
                    {selectedApp.status === "preliminary_accepted" && <CongratulationsScreen app={selectedApp} />}

                    {selectedApp.status !== "preliminary_accepted" && selectedApp.notes && (
                      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#1d4ed8" }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{isAr ? "ملاحظة المشرف" : "Advisor Note"}</div>
                        {selectedApp.notes}
                      </div>
                    )}

                    {/* Timeline */}
                    {selectedApp.events.length > 0 && (
                      <div style={{ marginTop: selectedApp.status === "preliminary_accepted" ? 20 : 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {isAr ? "سجل التتبع" : "Timeline"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {selectedApp.events.map((ev, i) => {
                            const evCfg = STATUS_CONFIG[ev.toStatus] ?? { color: "#94a3b8", en: ev.toStatus, ar: ev.toStatus };
                            return (
                              <div key={ev.id} style={{ position: "relative", paddingInlineStart: 22 }}>
                                <div style={{ position: "absolute", insetInlineStart: 0, top: 4, width: 12, height: 12, borderRadius: "50%", background: evCfg.color }} />
                                {i < selectedApp.events.length - 1 && (
                                  <div style={{ position: "absolute", insetInlineStart: 5, top: 18, bottom: -10, width: 2, background: border }} />
                                )}
                                <div style={{ fontSize: 12, fontWeight: 700, color: evCfg.color }}>
                                  {isAr ? (evCfg as any).ar : (evCfg as any).en}
                                </div>
                                {ev.notes && <div style={{ fontSize: 11, color: textMuted, marginTop: 2, fontStyle: "italic" }}>{ev.notes}</div>}
                                <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{new Date(ev.createdAt).toLocaleString()}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Fee info */}
                    {selectedApp.tuitionFee && (
                      <div style={{ marginTop: 16, padding: "12px 14px", background: isDark ? "#0f172a" : "#f8faff", borderRadius: 10, border: `1px solid ${border}` }}>
                        <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>{isAr ? "رسوم الدراسة" : "Tuition Fee"}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: textMain }}>{selectedApp.currency ?? ""} {Number(selectedApp.tuitionFee).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{isAr ? "سنوياً" : "per year"}</div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {tab === "notifications" && (
          <div style={{ maxWidth: 700 }}>
            {unreadNotifs > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <button onClick={markAllRead} style={{ padding: "7px 16px", background: "transparent", border: `1px solid ${border}`, borderRadius: 8, fontSize: 12, color: textMuted, cursor: "pointer", fontFamily: font }}>
                  {isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
                </button>
              </div>
            )}
            {notifLoading ? (
              <div style={{ textAlign: "center", padding: 60, color: textMuted }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: textMuted, background: cardBg, borderRadius: 16, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{isAr ? "لا توجد إشعارات" : "No notifications yet"}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    style={{ background: n.read ? cardBg : (isDark ? "#1e293b" : "#eff6ff"), border: `1px solid ${n.read ? border : "#bfdbfe"}`, borderRadius: 12, padding: "14px 18px", cursor: n.read ? "default" : "pointer", transition: "all .15s" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: textMain, marginBottom: 4 }}>
                          {!n.read && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginInlineEnd: 8, verticalAlign: "middle" }} />}
                          {n.title}
                        </div>
                        <div style={{ fontSize: 13, color: textMuted }}>{n.message}</div>
                      </div>
                      <div style={{ fontSize: 11, color: textMuted, flexShrink: 0 }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {markingRead === n.id && <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>...</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
