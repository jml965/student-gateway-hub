import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Lang = "ar" | "en";
type Theme = "light" | "dark";
type Tab = "profile" | "specializations";

interface Specialization {
  id: number; nameAr: string; nameEn: string;
  degree: string; durationYears: number;
  tuitionFee: string | null; currency: string; status: string;
}

interface UniversityProfile {
  id: number; nameAr: string; nameEn: string;
  country: string; city: string; website: string | null;
  logoUrl: string | null; email: string | null; phone: string | null;
  address: string | null; descriptionAr: string | null; descriptionEn: string | null;
  status: string; paymentMode: string; createdAt: string; approvedAt: string | null;
  specializations: Specialization[];
}

const T = {
  ar: {
    dir: "rtl" as const,
    title: "بوابة الجامعة",
    tabProfile: "الملف الشخصي",
    tabSpecs: "التخصصات",
    status: "حالة الجامعة",
    statusPending: "⏳ قيد المراجعة — في انتظار موافقة الإدارة",
    statusActive: "✅ معتمدة ومفعّلة",
    statusRejected: "❌ مرفوضة",
    statusInactive: "⛔ موقوفة",
    editProfile: "تعديل الملف الشخصي",
    saveProfile: "حفظ التغييرات",
    saving: "جارٍ الحفظ...",
    nameAr: "اسم الجامعة (عربي)",
    nameEn: "اسم الجامعة (إنجليزي)",
    city: "المدينة",
    website: "الموقع الإلكتروني",
    phone: "الهاتف",
    address: "العنوان",
    descAr: "الوصف (عربي)",
    descEn: "الوصف (إنجليزي)",
    logoUrl: "رابط شعار الجامعة",
    addSpec: "إضافة تخصص",
    specNameAr: "اسم التخصص (عربي)",
    specNameEn: "اسم التخصص (إنجليزي)",
    degree: "الدرجة العلمية",
    duration: "مدة الدراسة (سنوات)",
    fee: "الرسوم الدراسية",
    currency: "العملة",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    bachelor: "بكالوريوس", master: "ماجستير", phd: "دكتوراه", diploma: "دبلوم",
    noSpecs: "لا توجد تخصصات مضافة بعد",
    addSpecBtn: "+ إضافة تخصص",
    approvedOn: "تاريخ الاعتماد:",
    logout: "تسجيل الخروج",
    pendingNote: "يمكنك تعديل بيانات جامعتك في انتظار الموافقة.",
    lockedNote: "لا يمكن إضافة التخصصات إلا بعد الموافقة على الجامعة.",
  },
  en: {
    dir: "ltr" as const,
    title: "University Portal",
    tabProfile: "Profile",
    tabSpecs: "Specializations",
    status: "University Status",
    statusPending: "⏳ Pending — Awaiting admin approval",
    statusActive: "✅ Approved & Active",
    statusRejected: "❌ Rejected",
    statusInactive: "⛔ Suspended",
    editProfile: "Edit Profile",
    saveProfile: "Save Changes",
    saving: "Saving...",
    nameAr: "University Name (Arabic)",
    nameEn: "University Name (English)",
    city: "City",
    website: "Website",
    phone: "Phone",
    address: "Address",
    descAr: "Description (Arabic)",
    descEn: "Description (English)",
    logoUrl: "Logo URL",
    addSpec: "Add Specialization",
    specNameAr: "Specialization Name (Arabic)",
    specNameEn: "Specialization Name (English)",
    degree: "Degree",
    duration: "Duration (years)",
    fee: "Tuition Fee",
    currency: "Currency",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    bachelor: "Bachelor", master: "Master", phd: "PhD", diploma: "Diploma",
    noSpecs: "No specializations added yet",
    addSpecBtn: "+ Add Specialization",
    approvedOn: "Approved on:",
    logout: "Logout",
    pendingNote: "You can edit your university information while awaiting approval.",
    lockedNote: "Specializations can only be added after your university is approved.",
  },
};

interface Props { lang: Lang; theme: Theme; navigate: (p: string) => void; }

export default function UniversityPortalPage({ lang, theme, navigate }: Props) {
  const t = T[lang];
  const isDark = theme === "dark";
  const { user, logout } = useAuth();
  const bg = isDark ? "#0d1117" : "#f0f4ff";
  const card = isDark ? "#161b27" : "#ffffff";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d3748" : "#e2e8f0";
  const blue = "#2563eb";

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UniversityProfile>>({});
  const [saving, setSaving] = useState(false);

  const [showAddSpec, setShowAddSpec] = useState(false);
  const [specForm, setSpecForm] = useState({ nameAr: "", nameEn: "", degree: "bachelor", durationYears: 4, tuitionFee: "", currency: "USD" });
  const [editSpec, setEditSpec] = useState<Specialization | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<UniversityProfile>("/university-portal/profile");
      setProfile(data);
      setEditForm(data);
    } catch {
      navigate("home");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    } catch { } finally { setSaving(false); }
  };

  const addSpec = async () => {
    try {
      const spec = await api.post<Specialization>("/university-portal/specializations", { ...specForm, durationYears: Number(specForm.durationYears) });
      setProfile(p => p ? { ...p, specializations: [...p.specializations, spec] } : p);
      setShowAddSpec(false);
      setSpecForm({ nameAr: "", nameEn: "", degree: "bachelor", durationYears: 4, tuitionFee: "", currency: "USD" });
    } catch { }
  };

  const updateSpec = async () => {
    if (!editSpec) return;
    try {
      const updated = await api.put<Specialization>(`/university-portal/specializations/${editSpec.id}`, editSpec);
      setProfile(p => p ? { ...p, specializations: p.specializations.map(s => s.id === updated.id ? updated : s) } : p);
      setEditSpec(null);
    } catch { }
  };

  const deleteSpec = async (id: number) => {
    try {
      await api.delete(`/university-portal/specializations/${id}`);
      setProfile(p => p ? { ...p, specializations: p.specializations.filter(s => s.id !== id) } : p);
    } catch { }
  };

  const handleLogout = async () => { await logout(); navigate("home"); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: muted, fontSize: 16 }}>{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>
      </div>
    );
  }

  if (!profile) return null;

  const statusMsg = {
    pending: t.statusPending, active: t.statusActive,
    rejected: t.statusRejected, inactive: t.statusInactive,
  }[profile.status] ?? profile.status;

  const statusColor = {
    pending: "#f59e0b", active: "#10b981", rejected: "#ef4444", inactive: "#6b7280",
  }[profile.status] ?? muted;

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: `1.5px solid ${border}`, borderRadius: 8,
    background: isDark ? "#1e2537" : "#f8faff", color: text, fontSize: 13, outline: "none",
    boxSizing: "border-box", direction: t.dir,
    fontFamily: lang === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif",
  };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: muted, marginBottom: 4, display: "block" };
  const degreeOpts = [
    { v: "bachelor", l: t.bachelor }, { v: "master", l: t.master },
    { v: "phd", l: t.phd }, { v: "diploma", l: t.diploma },
  ];

  return (
    <div style={{ minHeight: "100vh", background: bg, direction: t.dir, fontFamily: lang === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏛️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: text }}>{lang === "ar" ? profile.nameAr : profile.nameEn}</div>
            <div style={{ fontSize: 11, color: muted }}>{t.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: statusColor, fontWeight: 600, background: statusColor + "18", padding: "4px 10px", borderRadius: 20 }}>
            {statusMsg}
          </span>
          <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "6px 14px", color: muted, cursor: "pointer", fontSize: 13 }}>
            {t.logout}
          </button>
        </div>
      </div>

      {/* Status banner for pending */}
      {profile.status === "pending" && (
        <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px 24px", fontSize: 13, textAlign: "center" }}>
          {t.pendingNote}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: card, borderRadius: 12, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {(["profile", "specializations"] as Tab[]).map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              flex: 1, padding: "9px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === tb ? blue : "transparent", color: tab === tb ? "#fff" : muted, transition: "all 0.2s",
            }}>
              {tb === "profile" ? t.tabProfile : t.tabSpecs}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div style={{ background: card, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: text, fontWeight: 700, fontSize: 17, margin: 0 }}>{t.tabProfile}</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {t.editProfile}
                </button>
              )}
            </div>

            {editing ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ ...lbl, direction: "rtl" }}>{t.nameAr}</label>
                    <input value={editForm.nameAr ?? ""} onChange={e => setEditForm(f => ({ ...f, nameAr: e.target.value }))} style={{ ...inp, direction: "rtl" }} />
                  </div>
                  <div>
                    <label style={{ ...lbl, direction: "ltr" }}>{t.nameEn}</label>
                    <input value={editForm.nameEn ?? ""} onChange={e => setEditForm(f => ({ ...f, nameEn: e.target.value }))} style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={lbl}>{t.city}</label>
                    <input value={editForm.city ?? ""} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>{t.phone}</label>
                    <input value={editForm.phone ?? ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>{t.website}</label>
                    <input type="url" value={editForm.website ?? ""} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} style={inp} placeholder="https://" />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>{t.logoUrl}</label>
                    <input value={editForm.logoUrl ?? ""} onChange={e => setEditForm(f => ({ ...f, logoUrl: e.target.value }))} style={inp} placeholder="https://..." />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>{t.address}</label>
                    <input value={editForm.address ?? ""} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={{ ...lbl, direction: "rtl" }}>{t.descAr}</label>
                    <textarea rows={3} value={editForm.descriptionAr ?? ""} onChange={e => setEditForm(f => ({ ...f, descriptionAr: e.target.value }))} style={{ ...inp, resize: "vertical", direction: "rtl" }} />
                  </div>
                  <div>
                    <label style={{ ...lbl, direction: "ltr" }}>{t.descEn}</label>
                    <textarea rows={3} value={editForm.descriptionEn ?? ""} onChange={e => setEditForm(f => ({ ...f, descriptionEn: e.target.value }))} style={{ ...inp, resize: "vertical", direction: "ltr" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveProfile} disabled={saving} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                    {saving ? t.saving : t.saveProfile}
                  </button>
                  <button onClick={() => { setEditing(false); setEditForm(profile); }} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: muted, fontSize: 14 }}>
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {[
                  { l: t.nameAr, v: profile.nameAr }, { l: t.nameEn, v: profile.nameEn },
                  { l: t.city, v: profile.city }, { l: "Country", v: profile.country },
                  { l: t.phone, v: profile.phone ?? "—" }, { l: t.website, v: profile.website ?? "—" },
                  { l: t.address, v: profile.address ?? "—", full: true },
                  { l: t.descAr, v: profile.descriptionAr ?? "—", full: true },
                  { l: t.descEn, v: profile.descriptionEn ?? "—", full: true },
                ].map((row, i) => (
                  <div key={i} style={row.full ? { gridColumn: "1/-1" } : {}}>
                    <div style={{ fontSize: 11, color: muted, fontWeight: 600, marginBottom: 3 }}>{row.l}</div>
                    <div style={{ fontSize: 14, color: text, lineHeight: 1.5 }}>{row.v}</div>
                  </div>
                ))}
                {profile.approvedAt && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ fontSize: 11, color: muted, fontWeight: 600, marginBottom: 3 }}>{t.approvedOn}</div>
                    <div style={{ fontSize: 14, color: "#10b981" }}>{new Date(profile.approvedAt).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Specializations Tab */}
        {tab === "specializations" && (
          <div>
            {profile.status !== "active" ? (
              <div style={{ background: card, borderRadius: 16, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <p style={{ color: muted, fontSize: 14 }}>{t.lockedNote}</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ color: text, fontWeight: 700, fontSize: 17, margin: 0 }}>{t.tabSpecs}</h2>
                  <button onClick={() => setShowAddSpec(true)} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    {t.addSpecBtn}
                  </button>
                </div>

                {/* Add specialization form */}
                {showAddSpec && (
                  <div style={{ background: card, borderRadius: 12, padding: 20, marginBottom: 16, border: `2px solid ${blue}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ ...lbl, direction: "rtl" }}>{t.specNameAr} *</label>
                        <input value={specForm.nameAr} onChange={e => setSpecForm(f => ({ ...f, nameAr: e.target.value }))} style={{ ...inp, direction: "rtl" }} />
                      </div>
                      <div>
                        <label style={{ ...lbl, direction: "ltr" }}>{t.specNameEn} *</label>
                        <input value={specForm.nameEn} onChange={e => setSpecForm(f => ({ ...f, nameEn: e.target.value }))} style={{ ...inp, direction: "ltr" }} />
                      </div>
                      <div>
                        <label style={lbl}>{t.degree} *</label>
                        <select value={specForm.degree} onChange={e => setSpecForm(f => ({ ...f, degree: e.target.value }))} style={{ ...inp }}>
                          {degreeOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>{t.duration}</label>
                        <input type="number" min={1} max={10} value={specForm.durationYears} onChange={e => setSpecForm(f => ({ ...f, durationYears: Number(e.target.value) }))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>{t.fee}</label>
                        <input type="number" value={specForm.tuitionFee} onChange={e => setSpecForm(f => ({ ...f, tuitionFee: e.target.value }))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>{t.currency}</label>
                        <select value={specForm.currency} onChange={e => setSpecForm(f => ({ ...f, currency: e.target.value }))} style={inp}>
                          {["USD", "EUR", "GBP", "TRY", "MYR", "CAD", "AUD", "NZD"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={addSpec} disabled={!specForm.nameAr || !specForm.nameEn} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                        {t.save}
                      </button>
                      <button onClick={() => setShowAddSpec(false)} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", color: muted, fontSize: 13 }}>
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Specializations list */}
                {profile.specializations.length === 0 ? (
                  <div style={{ background: card, borderRadius: 16, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
                    <p style={{ color: muted, fontSize: 14 }}>{t.noSpecs}</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {profile.specializations.map(spec => (
                      <div key={spec.id} style={{ background: card, borderRadius: 12, padding: 18, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: `1px solid ${border}` }}>
                        {editSpec?.id === spec.id ? (
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                              <input value={editSpec.nameAr} onChange={e => setEditSpec(s => s && ({ ...s, nameAr: e.target.value }))} style={{ ...inp, direction: "rtl" }} />
                              <input value={editSpec.nameEn} onChange={e => setEditSpec(s => s && ({ ...s, nameEn: e.target.value }))} style={{ ...inp, direction: "ltr" }} />
                              <select value={editSpec.degree} onChange={e => setEditSpec(s => s && ({ ...s, degree: e.target.value }))} style={inp}>
                                {degreeOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                              <input type="number" value={editSpec.tuitionFee ?? ""} onChange={e => setEditSpec(s => s && ({ ...s, tuitionFee: e.target.value }))} style={inp} placeholder={t.fee} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={updateSpec} style={{ background: blue, color: "#fff", border: "none", borderRadius: 7, padding: "7px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{t.save}</button>
                              <button onClick={() => setEditSpec(null)} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 7, padding: "7px 14px", cursor: "pointer", color: muted, fontSize: 13 }}>{t.cancel}</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: text }}>
                                {lang === "ar" ? spec.nameAr : spec.nameEn}
                              </div>
                              <div style={{ fontSize: 12, color: muted, marginTop: 4, display: "flex", gap: 12 }}>
                                <span style={{ background: blue + "18", color: blue, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                                  {degreeOpts.find(d => d.v === spec.degree)?.l ?? spec.degree}
                                </span>
                                <span>{spec.durationYears} {lang === "ar" ? "سنوات" : "yrs"}</span>
                                {spec.tuitionFee && <span>{Number(spec.tuitionFee).toLocaleString()} {spec.currency}</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setEditSpec(spec)} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer", color: muted, fontSize: 12 }}>{t.edit}</button>
                              <button onClick={() => deleteSpec(spec.id)} style={{ background: "none", border: `1px solid #fee2e2`, borderRadius: 7, padding: "6px 12px", cursor: "pointer", color: "#ef4444", fontSize: 12 }}>{t.delete}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
