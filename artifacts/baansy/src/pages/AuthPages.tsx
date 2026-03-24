import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ArrR, ArrL, OkCircle, UserIco } from "@/components/icons";

type Page = "login" | "signup" | "forgot";
type Lang = "ar" | "en";
type Theme = "light" | "dark";

const T = {
  ar: {
    dir: "rtl" as const, font: "'Cairo','Inter',sans-serif",
    loginTitle: "تسجيل الدخول", loginSub: "مرحباً بعودتك! أدخل بياناتك للمتابعة",
    emailL: "البريد الإلكتروني", emailPH: "example@email.com",
    passL: "كلمة المرور", passPH: "أدخل كلمة المرور",
    forgotBtn: "نسيت كلمة المرور؟", loginSubmit: "دخول",
    noAcc: "ليس لديك حساب؟", goSignup: "إنشاء حساب", backHome: "العودة للرئيسية",
    signupTitle: "إنشاء حساب جديد", signupSub: "انضم إلى Baansy وابدأ رحلتك الجامعية",
    nameL: "الاسم الكامل", namePH: "أدخل اسمك الكامل",
    confL: "تأكيد كلمة المرور", confPH: "أعد إدخال كلمة المرور",
    termsText: "أوافق على", termsLink: "الشروط والأحكام وسياسة الخصوصية",
    signupSubmit: "إنشاء الحساب", hasAcc: "لديك حساب بالفعل؟", goLogin: "تسجيل الدخول",
    forgotTitle: "استعادة كلمة المرور", forgotSub: "أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة",
    sendLink: "إرسال رابط الاستعادة", backToLogin: "العودة لتسجيل الدخول",
    okTitle: "تم الإرسال!", okMsg: "تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور.",
    req: "هذا الحقل مطلوب", noMatch: "كلمتا المرور غير متطابقتين", termsReq: "يجب الموافقة على الشروط",
    tagline: "منصة التسجيل الجامعي الذكية",
  },
  en: {
    dir: "ltr" as const, font: "'Inter','Cairo',sans-serif",
    loginTitle: "Welcome back", loginSub: "Enter your credentials to continue",
    emailL: "Email address", emailPH: "example@email.com",
    passL: "Password", passPH: "Enter your password",
    forgotBtn: "Forgot password?", loginSubmit: "Sign In",
    noAcc: "Don't have an account?", goSignup: "Sign Up", backHome: "Back to Home",
    signupTitle: "Create your account", signupSub: "Join Baansy and start your university journey",
    nameL: "Full Name", namePH: "Enter your full name",
    confL: "Confirm Password", confPH: "Re-enter your password",
    termsText: "I agree to the", termsLink: "Terms & Conditions and Privacy Policy",
    signupSubmit: "Create Account", hasAcc: "Already have an account?", goLogin: "Sign In",
    forgotTitle: "Reset Password", forgotSub: "Enter your email and we'll send you a reset link",
    sendLink: "Send Reset Link", backToLogin: "Back to Sign In",
    okTitle: "Email sent!", okMsg: "Check your inbox and follow the instructions to reset your password.",
    req: "This field is required", noMatch: "Passwords do not match", termsReq: "You must agree to the terms",
    tagline: "Smart University Registration Platform",
  },
};

function AuthWrap({ lang, theme, children }: { lang: Lang; theme: Theme; children: React.ReactNode }) {
  const tx = T[lang]; const isDark = theme === "dark";
  const cardBg = isDark ? "#1e293b" : "#fff";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: tx.font, direction: tx.dir, color: textMain, padding: 20, background: isDark ? "radial-gradient(ellipse at 60% 20%,#1e3a8a18 0%,#0d1117 70%)" : "radial-gradient(ellipse at 60% 20%,#dbeafe 0%,#f0f4ff 70%)", overflow: "auto" }}>
      <div style={{ width: "100%", maxWidth: 440, backgroundColor: cardBg, borderRadius: 24, padding: "40px 36px", boxShadow: isDark ? "0 20px 60px rgba(0,0,0,.5)" : "0 20px 60px rgba(37,99,235,.12)", border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(37,99,235,.4)" }}><GraduationCap size={22} color="#fff" /></div>
          <div><div style={{ fontWeight: 800, fontSize: 20, color: textMain }}>Baansy</div><div style={{ fontSize: 10, color: textMuted, marginTop: -2 }}>{tx.tagline}</div></div>
        </div>
        {children}
      </div>
    </div>
  );
}

function AuthInput({ label, type = "text", placeholder, value, onChange, icon: Ic, rightSlot, error, lang, theme }: any) {
  const tx = T[lang]; const isDark = theme === "dark";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#0f172a" : "#f8faff";
  const [focused, setFocused] = useState(false);
  const borderCol = error ? "#ef4444" : focused ? "#2563eb" : isDark ? "#334155" : "#cbd5e1";
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: textMain, marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", backgroundColor: inputBg, border: `1.5px solid ${borderCol}`, borderRadius: 12, padding: "0 14px", gap: 10, transition: "border-color .15s", boxShadow: focused ? `0 0 0 3px ${error ? "#ef444420" : "#2563eb18"}` : "none" }}>
        {Ic && <Ic size={16} color={focused ? "#2563eb" : textMuted} />}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, border: "none", backgroundColor: "transparent", color: textMain, fontFamily: tx.font, fontSize: 14, padding: "13px 0", direction: tx.dir, textAlign: lang === "ar" ? "right" : "left", outline: "none" }} />
        {rightSlot}
      </div>
      {error && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, textAlign: lang === "ar" ? "right" : "left" }}>{error}</div>}
    </div>
  );
}

export function LoginPage({ lang, theme, navigate }: { lang: Lang; theme: Theme; navigate: (p: string) => void }) {
  const tx = T[lang]; const isDark = theme === "dark";
  const textMain = isDark ? "#f1f5f9" : "#1e293b"; const textMuted = isDark ? "#94a3b8" : "#64748b";
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [show, setShow] = useState(false); const [errs, setErrs] = useState<any>({}); const [load, setLoad] = useState(false); const [apiErr, setApiErr] = useState("");
  const { login } = useAuth();

  const submit = async () => {
    const e: any = {};
    if (!email.trim()) e.email = tx.req;
    if (!pass) e.pass = tx.req;
    setErrs(e); setApiErr("");
    if (Object.keys(e).length) return;
    setLoad(true);
    try {
      await login(email, pass);
      navigate("home");
    } catch (err: any) {
      setApiErr(err.message || "Login failed");
    } finally {
      setLoad(false);
    }
  };

  return (
    <AuthWrap lang={lang} theme={theme}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: textMain, textAlign: "center", marginBottom: 6 }}>{tx.loginTitle}</h2>
      <p style={{ fontSize: 13, color: textMuted, textAlign: "center", marginBottom: 28 }}>{tx.loginSub}</p>
      {apiErr && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16, textAlign: "center" }}>{apiErr}</div>}
      <AuthInput label={tx.emailL} type="email" placeholder={tx.emailPH} value={email} onChange={(e: any) => setEmail(e.target.value)} icon={Mail} error={errs.email} lang={lang} theme={theme} />
      <AuthInput label={tx.passL} type={show ? "text" : "password"} placeholder={tx.passPH} value={pass} onChange={(e: any) => setPass(e.target.value)} icon={Lock} error={errs.pass} lang={lang} theme={theme}
        rightSlot={<button onClick={() => setShow(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: textMuted, flexShrink: 0 }}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
      <div style={{ textAlign: lang === "ar" ? "left" : "right", marginTop: -8, marginBottom: 24 }}>
        <button onClick={() => navigate("forgot")} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: 12, fontWeight: 600, fontFamily: tx.font }}>{tx.forgotBtn}</button>
      </div>
      <button onClick={submit} disabled={load} style={{ width: "100%", padding: 14, background: load ? "#93c5fd" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: load ? "default" : "pointer", fontFamily: tx.font, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(37,99,235,.35)" }}>
        {load ? "..." : <><LogIn size={16} />{tx.loginSubmit}</>}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: textMuted, marginTop: 20 }}>
        {tx.noAcc}&nbsp;<button onClick={() => navigate("signup")} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontWeight: 700, fontSize: 13, fontFamily: tx.font }}>{tx.goSignup}</button>
      </p>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 12, fontFamily: tx.font, display: "inline-flex", alignItems: "center", gap: 5 }}>
          {lang === "ar" ? <ArrR size={13} /> : <ArrL size={13} />}{tx.backHome}
        </button>
      </div>
    </AuthWrap>
  );
}

export function SignupPage({ lang, theme, navigate }: { lang: Lang; theme: Theme; navigate: (p: string) => void }) {
  const tx = T[lang]; const isDark = theme === "dark";
  const textMain = isDark ? "#f1f5f9" : "#1e293b"; const textMuted = isDark ? "#94a3b8" : "#64748b";
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [pass, setPass] = useState(""); const [conf, setConf] = useState("");
  const [showP, setShowP] = useState(false); const [showC, setShowC] = useState(false);
  const [agreed, setAgreed] = useState(false); const [errs, setErrs] = useState<any>({}); const [load, setLoad] = useState(false); const [apiErr, setApiErr] = useState("");
  const { register } = useAuth();

  const submit = async () => {
    const e: any = {};
    if (!name.trim()) e.name = tx.req; if (!email.trim()) e.email = tx.req;
    if (!pass) e.pass = tx.req; if (!conf) e.conf = tx.req;
    else if (pass && conf && pass !== conf) e.conf = tx.noMatch;
    if (!agreed) e.terms = tx.termsReq;
    setErrs(e); setApiErr("");
    if (Object.keys(e).length) return;
    setLoad(true);
    try {
      await register({ name, email, password: pass });
      navigate("home");
    } catch (err: any) {
      setApiErr(err.message || "Registration failed");
    } finally {
      setLoad(false);
    }
  };

  return (
    <AuthWrap lang={lang} theme={theme}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: textMain, textAlign: "center", marginBottom: 6 }}>{tx.signupTitle}</h2>
      <p style={{ fontSize: 13, color: textMuted, textAlign: "center", marginBottom: 22 }}>{tx.signupSub}</p>
      {apiErr && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16, textAlign: "center" }}>{apiErr}</div>}
      <AuthInput label={tx.nameL} placeholder={tx.namePH} value={name} onChange={(e: any) => setName(e.target.value)} icon={UserIco} error={errs.name} lang={lang} theme={theme} />
      <AuthInput label={tx.emailL} type="email" placeholder={tx.emailPH} value={email} onChange={(e: any) => setEmail(e.target.value)} icon={Mail} error={errs.email} lang={lang} theme={theme} />
      <AuthInput label={tx.passL} type={showP ? "text" : "password"} placeholder={tx.passPH} value={pass} onChange={(e: any) => setPass(e.target.value)} icon={Lock} error={errs.pass} lang={lang} theme={theme}
        rightSlot={<button onClick={() => setShowP(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: textMuted, flexShrink: 0 }}>{showP ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
      <AuthInput label={tx.confL} type={showC ? "text" : "password"} placeholder={tx.confPH} value={conf} onChange={(e: any) => setConf(e.target.value)} icon={Lock} error={errs.conf} lang={lang} theme={theme}
        rightSlot={<button onClick={() => setShowC(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: textMuted, flexShrink: 0 }}>{showC ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
      <div style={{ marginBottom: 20 }}>
        <div onClick={() => setAgreed(a => !a)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", direction: tx.dir }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${agreed ? "#2563eb" : errs.terms ? "#ef4444" : "#cbd5e1"}`, background: agreed ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
            {agreed && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>}
          </div>
          <span style={{ fontSize: 12, color: textMuted }}>{tx.termsText} <span style={{ color: "#2563eb", fontWeight: 600 }}>{tx.termsLink}</span></span>
        </div>
        {errs.terms && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errs.terms}</div>}
      </div>
      <button onClick={submit} disabled={load} style={{ width: "100%", padding: 14, background: load ? "#93c5fd" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: load ? "default" : "pointer", fontFamily: tx.font, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(37,99,235,.35)" }}>
        {load ? "..." : <><UserPlus size={16} />{tx.signupSubmit}</>}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: textMuted, marginTop: 20 }}>
        {tx.hasAcc}&nbsp;<button onClick={() => navigate("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontWeight: 700, fontSize: 13, fontFamily: tx.font }}>{tx.goLogin}</button>
      </p>
    </AuthWrap>
  );
}

export function ForgotPage({ lang, theme, navigate }: { lang: Lang; theme: Theme; navigate: (p: string) => void }) {
  const tx = T[lang]; const isDark = theme === "dark";
  const textMain = isDark ? "#f1f5f9" : "#1e293b"; const textMuted = isDark ? "#94a3b8" : "#64748b";
  const [email, setEmail] = useState(""); const [errs, setErrs] = useState<any>({});
  const [load, setLoad] = useState(false); const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) { setErrs({ email: tx.req }); return; }
    setLoad(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } finally {
      setLoad(false);
    }
  };

  return (
    <AuthWrap lang={lang} theme={theme}>
      {sent ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#22c55e)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(22,163,74,.3)" }}><OkCircle size={30} color="#fff" /></div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: textMain, marginBottom: 10 }}>{tx.okTitle}</h2>
          <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.6, marginBottom: 28 }}>{tx.okMsg}</p>
          <button onClick={() => navigate("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: 13, fontWeight: 700, fontFamily: tx.font }}>{tx.backToLogin}</button>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: textMain, textAlign: "center", marginBottom: 6 }}>{tx.forgotTitle}</h2>
          <p style={{ fontSize: 13, color: textMuted, textAlign: "center", marginBottom: 28 }}>{tx.forgotSub}</p>
          <AuthInput label={tx.emailL} type="email" placeholder={tx.emailPH} value={email} onChange={(e: any) => setEmail(e.target.value)} icon={Mail} error={errs.email} lang={lang} theme={theme} />
          <button onClick={submit} disabled={load} style={{ width: "100%", padding: 14, background: load ? "#93c5fd" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: load ? "default" : "pointer", fontFamily: tx.font, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(37,99,235,.35)" }}>
            {load ? "..." : tx.sendLink}
          </button>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={() => navigate("login")} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 12, fontFamily: tx.font, display: "inline-flex", alignItems: "center", gap: 5 }}>
              {lang === "ar" ? <ArrR size={13} /> : <ArrL size={13} />}{tx.backToLogin}
            </button>
          </div>
        </>
      )}
    </AuthWrap>
  );
}
