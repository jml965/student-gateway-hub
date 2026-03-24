import { useState } from "react";
import { api } from "@/lib/api";


type Lang = "ar" | "en";
type Theme = "light" | "dark";

const T = {
  ar: {
    dir: "rtl" as const,
    title: "تسجيل جامعتك في Baansy",
    sub: "أدخل بيانات جامعتك. سيتم مراجعة طلبك من قِبَل الإدارة وإخطارك بالموافقة.",
    contactName: "اسم المسؤول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    phone: "رقم الهاتف",
    nameAr: "اسم الجامعة (عربي)",
    nameEn: "اسم الجامعة (إنجليزي)",
    country: "الدولة",
    city: "المدينة",
    website: "الموقع الإلكتروني",
    address: "العنوان",
    descAr: "وصف الجامعة (عربي)",
    descEn: "وصف الجامعة (إنجليزي)",
    submit: "تقديم الطلب",
    submitting: "جارٍ التقديم...",
    success: "تم تقديم طلبك بنجاح! ستتلقى إشعاراً عند موافقة الإدارة.",
    backLogin: "تسجيل الدخول",
    loginPrompt: "لديك حساب بالفعل؟",
    required: "* حقل إلزامي",
    sectionContact: "بيانات المسؤول",
    sectionUni: "بيانات الجامعة",
  },
  en: {
    dir: "ltr" as const,
    title: "Register your University on Baansy",
    sub: "Submit your university's information. Our team will review the application and notify you upon approval.",
    contactName: "Contact Person Name",
    email: "Email Address",
    password: "Password",
    phone: "Phone Number",
    nameAr: "University Name (Arabic)",
    nameEn: "University Name (English)",
    country: "Country",
    city: "City",
    website: "Website URL",
    address: "Address",
    descAr: "Description (Arabic)",
    descEn: "Description (English)",
    submit: "Submit Application",
    submitting: "Submitting...",
    success: "Application submitted! You will be notified once an admin reviews it.",
    backLogin: "Login",
    loginPrompt: "Already have an account?",
    required: "* Required field",
    sectionContact: "Contact Person",
    sectionUni: "University Details",
  },
};

interface Props { lang: Lang; theme: Theme; navigate: (p: string) => void; }

export default function UniversityRegisterPage({ lang, theme, navigate }: Props) {
  const t = T[lang];
  const isDark = theme === "dark";
  const bg = isDark ? "#0d1117" : "#f0f4ff";
  const card = isDark ? "#161b27" : "#ffffff";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d3748" : "#e2e8f0";
  const blue = "#2563eb";

  const [form, setForm] = useState({
    contactName: "", email: "", password: "", phone: "",
    nameAr: "", nameEn: "", country: "", city: "",
    website: "", address: "", descriptionAr: "", descriptionEn: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/university-portal/register", form);
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: `1.5px solid ${border}`,
    borderRadius: 8, background: isDark ? "#1e2537" : "#f8faff",
    color: text, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: lang === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    direction: t.dir,
  };

  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: sub, marginBottom: 4, display: "block" };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", direction: t.dir }}>
        <div style={{ background: card, borderRadius: 16, padding: 40, maxWidth: 460, width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
          <h2 style={{ color: blue, fontWeight: 700, fontSize: 22, marginBottom: 12 }}>{lang === "ar" ? "تم التقديم بنجاح!" : "Application Submitted!"}</h2>
          <p style={{ color: sub, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>{t.success}</p>
          <button onClick={() => navigate("login")} style={{ background: blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            {t.backLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, direction: t.dir, overflowY: "auto", padding: "40px 0" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
          <h1 style={{ color: text, fontWeight: 800, fontSize: 24, margin: "0 0 8px" }}>{t.title}</h1>
          <p style={{ color: sub, fontSize: 14, lineHeight: 1.7 }}>{t.sub}</p>
        </div>

        <form onSubmit={submit}>
          <div style={{ background: card, borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <h3 style={{ color: blue, fontWeight: 700, fontSize: 15, marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${border}` }}>
              {t.sectionContact}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>{t.contactName} *</label>
                <input required value={form.contactName} onChange={set("contactName")} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.email} *</label>
                <input required type="email" value={form.email} onChange={set("email")} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.password} *</label>
                <input required type="password" minLength={8} value={form.password} onChange={set("password")} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>{t.phone}</label>
                <input value={form.phone} onChange={set("phone")} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ background: card, borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <h3 style={{ color: blue, fontWeight: 700, fontSize: 15, marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${border}` }}>
              {t.sectionUni}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>{t.nameAr} *</label>
                <input required value={form.nameAr} onChange={set("nameAr")} style={{ ...inputStyle, direction: "rtl" }} />
              </div>
              <div>
                <label style={labelStyle}>{t.nameEn} *</label>
                <input required value={form.nameEn} onChange={set("nameEn")} style={{ ...inputStyle, direction: "ltr" }} />
              </div>
              <div>
                <label style={labelStyle}>{t.country} *</label>
                <input required value={form.country} onChange={set("country")} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.city} *</label>
                <input required value={form.city} onChange={set("city")} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>{t.website}</label>
                <input type="url" value={form.website} onChange={set("website")} style={inputStyle} placeholder="https://" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>{t.address}</label>
                <input value={form.address} onChange={set("address")} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.descAr}</label>
                <textarea value={form.descriptionAr} onChange={set("descriptionAr")} rows={3}
                  style={{ ...inputStyle, resize: "vertical", direction: "rtl" }} />
              </div>
              <div>
                <label style={labelStyle}>{t.descEn}</label>
                <textarea value={form.descriptionEn} onChange={set("descriptionEn")} rows={3}
                  style={{ ...inputStyle, resize: "vertical", direction: "ltr" }} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px", background: loading ? "#94a3b8" : blue, color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? t.submitting : t.submit}
          </button>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: sub }}>
            {t.loginPrompt}{" "}
            <button type="button" onClick={() => navigate("login")} style={{ background: "none", border: "none", color: blue, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              {t.backLogin}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
