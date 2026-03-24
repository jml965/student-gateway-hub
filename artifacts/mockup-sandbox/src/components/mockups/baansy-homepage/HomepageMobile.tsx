import "./_group.css";
import { useState } from "react";
import {
  GraduationCap,
  Home,
  Heart,
  Plane,
  FileText,
  CreditCard,
  IdCard,
  MessageSquarePlus,
  Moon,
  Sun,
  Globe,
  ChevronRight,
  Send,
  Building2,
  Building,
  Sparkles,
  Menu,
  X,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  User,
  Plus,
} from "lucide-react";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

const t = {
  ar: {
    dir: "rtl" as const,
    font: "'Cairo', 'Inter', sans-serif",
    logo: "Baansy",
    tagline: "منصة التسجيل الجامعي الذكية",
    newChat: "محادثة جديدة",
    todayLabel: "اليوم",
    history: ["هل يوجد غيرهم", "مرحباً", "استفسار عن الفيزا"],
    assistantLabel: "مساعد Baansy الذكي",
    welcomeTitle: "مرحباً بك في Baansy",
    welcomeSub: "أكثر من 19,000 جامعة حول العالم",
    stat1: "4,000+ خاصة",
    stat2: "15,000+ حكومية",
    inputPlaceholder: "اكتب رسالتك...",
    servicesLabel: "كيف يمكنني مساعدتك؟",
    services: [
      { icon: GraduationCap, label: "تسجيل الجامعات", desc: "4000+ خاصة و15000+ حكومية" },
      { icon: Home, label: "السكن الطلابي", desc: "إيجاد سكن قريب من جامعتك" },
      { icon: Heart, label: "التأمين الصحي", desc: "تغطية طبية شاملة للطلاب" },
      { icon: Plane, label: "استقبال من المطار", desc: "خدمة النقل وحجز التذاكر" },
      { icon: FileText, label: "تجهيز الفيزا", desc: "مساعدة كاملة في ملف الفيزا" },
      { icon: IdCard, label: "البطاقة الطلابية الدولية", desc: "خصومات حصرية حول العالم" },
      { icon: CreditCard, label: "كارت فيزا / ماستركارد", desc: "بطاقة مسبقة الدفع للطلاب" },
    ],
    disclaimer: "قد يقدم Baansy AI معلومات غير دقيقة",
    switchLang: "EN",
    loginBtn: "تسجيل الدخول",
    signupBtn: "إنشاء حساب",
    settingsBtn: "الإعدادات",
    logoutBtn: "تسجيل الخروج",
    loggedInAs: "أحمد",
    themeLight: "وضع فاتح",
    themeDark: "وضع داكن",
    menuTitle: "القائمة",
    recentChats: "المحادثات الأخيرة",
  },
  en: {
    dir: "ltr" as const,
    font: "'Inter', sans-serif",
    logo: "Baansy",
    tagline: "Smart University Registration",
    newChat: "New Chat",
    todayLabel: "Today",
    history: ["Are there others?", "Hello", "Visa inquiry"],
    assistantLabel: "Baansy AI Assistant",
    welcomeTitle: "Welcome to Baansy",
    welcomeSub: "19,000+ universities worldwide",
    stat1: "4,000+ Private",
    stat2: "15,000+ Public",
    inputPlaceholder: "Type your message...",
    servicesLabel: "How can I help you?",
    services: [
      { icon: GraduationCap, label: "University Registration", desc: "4,000+ private & 15,000+ public" },
      { icon: Home, label: "Student Housing", desc: "Find housing near your university" },
      { icon: Heart, label: "Health Insurance", desc: "Comprehensive student medical coverage" },
      { icon: Plane, label: "Airport Pickup", desc: "Transfer services & ticket booking" },
      { icon: FileText, label: "Visa Assistance", desc: "Complete help with student visa files" },
      { icon: IdCard, label: "International Student Card", desc: "Exclusive discounts worldwide" },
      { icon: CreditCard, label: "Visa / Mastercard", desc: "Prepaid card for students" },
    ],
    disclaimer: "Baansy AI may provide inaccurate information",
    switchLang: "عر",
    loginBtn: "Login",
    signupBtn: "Sign Up",
    settingsBtn: "Settings",
    logoutBtn: "Logout",
    loggedInAs: "Ahmed",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    menuTitle: "Menu",
    recentChats: "Recent Chats",
  },
};

export function HomepageMobile() {
  const [lang, setLang] = useState<Lang>("ar");
  const [theme, setTheme] = useState<Theme>("light");
  const [inputVal, setInputVal] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const tx = t[lang];
  const isDark = theme === "dark";

  const bg = isDark ? "#0d1117" : "#f8faff";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#1e293b" : "#ffffff";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";
  const topBarBg = isDark ? "#0f172a" : "#ffffff";
  const topBarBorder = isDark ? "#1e293b" : "#e2e8f0";
  const accentBlue = "#2563eb";
  const accentBlueSoft = isDark ? "#1d4ed820" : "#eff6ff";
  const accentBlueText = isDark ? "#93c5fd" : "#1d4ed8";
  const drawerBg = isDark ? "#0f172a" : "#f8faff";
  const drawerBorder = isDark ? "#1e293b" : "#c7d2fe";
  const ctrlBg = isDark ? "#1e293b" : "#dbeafe";
  const ctrlColor = isDark ? "#93c5fd" : "#1d4ed8";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        fontFamily: tx.font,
        direction: tx.dir,
        backgroundColor: bg,
        color: textMain,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Drawer Overlay ── */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 40,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Side Drawer ── */}
      <div
        style={{
          position: "absolute",
          top: 0, bottom: 0,
          right: lang === "ar" ? (menuOpen ? 0 : -280) : "auto",
          left: lang === "en" ? (menuOpen ? 0 : -280) : "auto",
          width: 280,
          backgroundColor: drawerBg,
          borderLeft: lang === "ar" ? "none" : `1px solid ${drawerBorder}`,
          borderRight: lang === "ar" ? `1px solid ${drawerBorder}` : "none",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          padding: "0",
          transition: "right 0.28s cubic-bezier(0.4,0,0.2,1), left 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: menuOpen ? (lang === "ar" ? "-8px 0 32px rgba(0,0,0,0.25)" : "8px 0 32px rgba(0,0,0,0.25)") : "none",
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 16px 14px",
          borderBottom: `1px solid ${drawerBorder}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <GraduationCap size={17} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: textMain }}>{tx.logo}</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              width: 30, height: 30, borderRadius: 8,
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: textMuted,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat inside drawer */}
        <div style={{ padding: "14px 14px 8px" }}>
          <button
            style={{
              width: "100%", backgroundColor: "#2563eb", color: "#fff",
              border: "none", borderRadius: 10, padding: "10px",
              fontFamily: tx.font, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, justifyContent: "center",
              boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            }}
          >
            <Plus size={15} />
            {tx.newChat}
          </button>
        </div>

        {/* Recent chats */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 0 6px" }}>
            {tx.recentChats}
          </div>
          {tx.history.map((item, i) => (
            <div key={i} style={{
              padding: "9px 10px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, color: textMuted,
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 2,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isDark ? "#1e293b" : "#dbeafe"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
            >
              <MessageSquarePlus size={13} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Drawer bottom: controls + auth */}
        <div style={{ padding: "12px 14px 20px", borderTop: `1px solid ${drawerBorder}`, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Theme + Language */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              style={{
                flex: 1, backgroundColor: ctrlBg, color: ctrlColor,
                border: "none", borderRadius: 8, padding: "8px 6px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 500,
                fontFamily: tx.font,
              }}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
              {isDark ? tx.themeLight : tx.themeDark}
            </button>
            <button
              onClick={() => { setLang(lang === "ar" ? "en" : "ar"); }}
              style={{
                flex: 1, backgroundColor: ctrlBg, color: ctrlColor,
                border: "none", borderRadius: 8, padding: "8px 6px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 600,
                fontFamily: tx.font,
              }}
            >
              <Globe size={13} />
              {tx.switchLang}
            </button>
          </div>

          {/* Auth */}
          {isLoggedIn ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",
                backgroundColor: accentBlueSoft,
                borderRadius: 9,
                border: `1px solid ${isDark ? "#1d4ed830" : "#bfdbfe"}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #1d4ed8, #60a5fa)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={14} color="#fff" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: accentBlueText }}>
                  {lang === "ar" ? "مرحباً، " : "Hi, "}{tx.loggedInAs}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{
                  flex: 1, backgroundColor: ctrlBg, color: ctrlColor,
                  border: "none", borderRadius: 8, padding: "8px 6px",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5, fontSize: 11, fontWeight: 500,
                  fontFamily: tx.font,
                }}>
                  <Settings size={13} />
                  {tx.settingsBtn}
                </button>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? "#2d1515" : "#fff1f2",
                    color: isDark ? "#f87171" : "#dc2626",
                    border: `1px solid ${isDark ? "#7f1d1d40" : "#fecaca"}`,
                    borderRadius: 8, padding: "8px 6px",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 5, fontSize: 11, fontWeight: 600,
                    fontFamily: tx.font,
                  }}
                >
                  <LogOut size={13} />
                  {tx.logoutBtn}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setIsLoggedIn(true)}
                style={{
                  flex: 1, backgroundColor: ctrlBg, color: ctrlColor,
                  border: "none", borderRadius: 8, padding: "9px 6px",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 500,
                  fontFamily: tx.font,
                }}
              >
                <LogIn size={13} />
                {tx.loginBtn}
              </button>
              <button
                onClick={() => setIsLoggedIn(true)}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                  color: "#fff",
                  border: "none", borderRadius: 8, padding: "9px 6px",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 600,
                  fontFamily: tx.font,
                  boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
                }}
              >
                <UserPlus size={13} />
                {tx.signupBtn}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Bar ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        backgroundColor: topBarBg,
        borderBottom: `1px solid ${topBarBorder}`,
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}>
            <GraduationCap size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: textMain, lineHeight: 1.2 }}>{tx.logo}</div>
            <div style={{ fontSize: 9, color: textMuted }}>{tx.tagline}</div>
          </div>
        </div>

        {/* Right: stats chip + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Compact stats */}
          <div style={{
            display: "flex", gap: 4,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 3,
              backgroundColor: accentBlueSoft,
              color: accentBlueText,
              borderRadius: 20, padding: "3px 8px",
              fontSize: 10, fontWeight: 600,
              border: `1px solid ${isDark ? "#1d4ed840" : "#bfdbfe"}`,
            }}>
              <Building size={9} />
              {tx.stat1}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 3,
              backgroundColor: accentBlueSoft,
              color: accentBlueText,
              borderRadius: 20, padding: "3px 8px",
              fontSize: 10, fontWeight: 600,
              border: `1px solid ${isDark ? "#1d4ed840" : "#bfdbfe"}`,
            }}>
              <Building2 size={9} />
              {tx.stat2}
            </div>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              color: textMuted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* ── Chat Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Welcome */}
        <div style={{ width: "100%", textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
          }}>
            <GraduationCap size={26} color="#fff" />
          </div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, margin: "0 0 8px",
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.3,
          }}>
            {tx.welcomeTitle}
          </h1>
          <p style={{ fontSize: 13, color: textMuted, margin: 0, lineHeight: 1.6 }}>
            {tx.welcomeSub}
          </p>
        </div>

        {/* Assistant label */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
          fontSize: 12, color: textMuted, fontWeight: 500,
          width: "100%",
          justifyContent: lang === "ar" ? "flex-end" : "flex-start",
        }}>
          <Sparkles size={13} color={accentBlue} />
          {tx.assistantLabel}
        </div>

        {/* Services Label */}
        <div style={{ width: "100%", marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: textMuted, margin: 0, textAlign: lang === "ar" ? "right" : "left" }}>
            {tx.servicesLabel}
          </p>
        </div>

        {/* Service Cards — single column on mobile */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 9 }}>
          {tx.services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <div
                key={i}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = accentBlue;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 10px rgba(37,99,235,0.15)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = cardBorder;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)";
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: isDark
                    ? "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)"
                    : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color={isDark ? "#93c5fd" : "#1d4ed8"} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>{svc.label}</div>
                  <div style={{ fontSize: 11, color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{svc.desc}</div>
                </div>
                <ChevronRight
                  size={14}
                  color={textMuted}
                  style={{ transform: lang === "ar" ? "rotate(180deg)" : "none", flexShrink: 0 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Input Bar (fixed bottom) ── */}
      <div style={{
        padding: "10px 16px 14px",
        borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
        backgroundColor: isDark ? "#0d1117" : "#ffffff",
        flexShrink: 0,
      }}>
        <div style={{
          backgroundColor: inputBg,
          border: `1.5px solid ${inputBorder}`,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          boxShadow: isDark ? "0 0 0 1px #334155" : "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <input
            type="text"
            placeholder={tx.inputPlaceholder}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: textMain,
              fontFamily: tx.font,
              fontSize: 14,
              direction: tx.dir,
              textAlign: lang === "ar" ? "right" : "left",
            }}
          />
          <button
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: inputVal.length > 0
                ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                : isDark ? "#1e293b" : "#f1f5f9",
              border: "none",
              cursor: inputVal.length > 0 ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Send size={15} color={inputVal.length > 0 ? "#fff" : textMuted} style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 9, color: textMuted, margin: "6px 0 0" }}>
          {tx.disclaimer}
        </p>
      </div>
    </div>
  );
}
