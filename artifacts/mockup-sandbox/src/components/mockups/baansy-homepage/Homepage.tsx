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
  MoreHorizontal,
  Building2,
  Building,
  Sparkles,
} from "lucide-react";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

const t = {
  ar: {
    dir: "rtl" as const,
    font: "'Cairo', 'Inter', sans-serif",
    logo: "Baansy",
    tagline: "منصة التسجيل الجامعي الذكية",
    newChat: "+ محادثة جديدة",
    todayLabel: "اليوم",
    history: ["هل يوجد غيرهم", "مرحباً", "استفسار عن الفيزا"],
    assistantLabel: "مساعد Baansy الذكي",
    welcomeTitle: "مرحباً بك في Baansy",
    welcomeSub: "منصتك الذكية للتسجيل في أكثر من",
    welcomeSub2: "جامعة حول العالم",
    stat1: "4,000+ جامعة خاصة",
    stat2: "15,000+ جامعة حكومية",
    inputPlaceholder: "اكتب رسالتك...",
    servicesLabel: "كيف يمكنني مساعدتك؟",
    services: [
      { icon: GraduationCap, label: "تسجيل الجامعات", desc: "4000+ جامعة خاصة و15000+ حكومية" },
      { icon: Home, label: "السكن الطلابي", desc: "إيجاد سكن قريب من جامعتك" },
      { icon: Heart, label: "التأمين الصحي", desc: "تغطية طبية شاملة للطلاب" },
      { icon: Plane, label: "استقبال من المطار", desc: "خدمة النقل وحجز التذاكر" },
      { icon: FileText, label: "تجهيز الفيزا", desc: "مساعدة كاملة في ملف الفيزا" },
      { icon: IdCard, label: "البطاقة الطلابية الدولية", desc: "خصومات حصرية حول العالم" },
      { icon: CreditCard, label: "كارت فيزا / ماستركارد", desc: "بطاقة مسبقة الدفع للطلاب" },
    ],
    disclaimer: "قد يقدم Baansy AI معلومات غير دقيقة · إشعار الخصوصية",
    switchLang: "EN",
  },
  en: {
    dir: "ltr" as const,
    font: "'Inter', sans-serif",
    logo: "Baansy",
    tagline: "Smart University Registration Platform",
    newChat: "+ New Chat",
    todayLabel: "Today",
    history: ["Are there others?", "Hello", "Visa inquiry"],
    assistantLabel: "Baansy AI Assistant",
    welcomeTitle: "Welcome to Baansy",
    welcomeSub: "Your smart platform for registering in over",
    welcomeSub2: "universities worldwide",
    stat1: "4,000+ Private Universities",
    stat2: "15,000+ Public Universities",
    inputPlaceholder: "Type your message...",
    servicesLabel: "How can I help you today?",
    services: [
      { icon: GraduationCap, label: "University Registration", desc: "4,000+ private & 15,000+ public" },
      { icon: Home, label: "Student Housing", desc: "Find housing near your university" },
      { icon: Heart, label: "Health Insurance", desc: "Comprehensive student medical coverage" },
      { icon: Plane, label: "Airport Pickup", desc: "Transfer services & ticket booking" },
      { icon: FileText, label: "Visa Assistance", desc: "Complete help with student visa files" },
      { icon: IdCard, label: "International Student Card", desc: "Exclusive discounts worldwide" },
      { icon: CreditCard, label: "Visa / Mastercard", desc: "Prepaid card for students" },
    ],
    disclaimer: "Baansy AI may provide inaccurate information · Privacy Notice",
    switchLang: "عر",
  },
};

export function Homepage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [theme, setTheme] = useState<Theme>("light");
  const [inputVal, setInputVal] = useState("");

  const tx = t[lang];
  const isDark = theme === "dark";

  const bg = isDark ? "#0d1117" : "#f8faff";
  const sidebarBg = isDark ? "#0f172a" : "#eef2ff";
  const sidebarBorder = isDark ? "#1e293b" : "#c7d2fe";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#1e293b" : "#ffffff";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";
  const accentBlue = "#2563eb";
  const accentBlueSoft = isDark ? "#1d4ed8" : "#eff6ff";
  const accentBlueText = isDark ? "#93c5fd" : "#1d4ed8";
  const newChatBg = "#2563eb";
  const historyHover = isDark ? "#1e293b" : "#dbeafe";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        fontFamily: tx.font,
        direction: tx.dir,
        backgroundColor: bg,
        color: textMain,
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          minWidth: 260,
          backgroundColor: sidebarBg,
          borderLeft: lang === "ar" ? "none" : `1px solid ${sidebarBorder}`,
          borderRight: lang === "ar" ? `1px solid ${sidebarBorder}` : "none",
          display: "flex",
          flexDirection: "column",
          padding: "16px 12px",
          gap: 8,
          order: lang === "ar" ? 1 : 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 16px", borderBottom: `1px solid ${sidebarBorder}` }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37,99,235,0.35)"
          }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: textMain }}>{tx.logo}</div>
            <div style={{ fontSize: 10, color: textMuted, marginTop: -1 }}>{tx.tagline}</div>
          </div>
        </div>

        {/* New Chat */}
        <button
          style={{
            backgroundColor: newChatBg,
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            fontFamily: tx.font,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
            marginTop: 4,
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}
        >
          <MessageSquarePlus size={16} />
          {tx.newChat}
        </button>

        {/* History */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px 8px" }}>
            {tx.todayLabel}
          </div>
          {tx.history.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                color: textMuted,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = historyHover; (e.currentTarget as HTMLDivElement).style.color = textMain; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLDivElement).style.color = textMuted; }}
            >
              <MessageSquarePlus size={14} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item}</span>
              <MoreHorizontal size={14} style={{ opacity: 0.4 }} />
            </div>
          ))}
        </div>

        {/* Bottom Controls */}
        <div style={{ marginTop: "auto", display: "flex", gap: 8, padding: "12px 0 0" }}>
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? "Light mode" : "Dark mode"}
            style={{
              flex: 1,
              backgroundColor: isDark ? "#1e293b" : "#dbeafe",
              color: isDark ? "#93c5fd" : "#1d4ed8",
              border: "none",
              borderRadius: 8,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? (lang === "ar" ? "فاتح" : "Light") : (lang === "ar" ? "داكن" : "Dark")}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            style={{
              flex: 1,
              backgroundColor: isDark ? "#1e293b" : "#dbeafe",
              color: isDark ? "#93c5fd" : "#1d4ed8",
              border: "none",
              borderRadius: 8,
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Globe size={14} />
            {tx.switchLang}
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: bg,
        }}
      >
        {/* Top bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
          backgroundColor: isDark ? "#0d1117" : "#ffffff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} color={accentBlue} />
            <span style={{ fontSize: 13, color: textMuted, fontWeight: 500 }}>
              {tx.assistantLabel}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Stats badges */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              backgroundColor: accentBlueSoft,
              color: accentBlueText,
              borderRadius: 20, padding: "4px 12px",
              fontSize: 11, fontWeight: 600,
              border: `1px solid ${isDark ? "#1d4ed8" : "#bfdbfe"}`,
            }}>
              <Building size={12} />
              {tx.stat1}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              backgroundColor: accentBlueSoft,
              color: accentBlueText,
              borderRadius: 20, padding: "4px 12px",
              fontSize: 11, fontWeight: 600,
              border: `1px solid ${isDark ? "#1d4ed8" : "#bfdbfe"}`,
            }}>
              <Building2 size={12} />
              {tx.stat2}
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Welcome */}
          <div style={{ maxWidth: 700, width: "100%", textAlign: "center", marginBottom: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(37,99,235,0.35)"
            }}>
              <GraduationCap size={30} color="#fff" />
            </div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, margin: "0 0 10px",
              background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {tx.welcomeTitle}
            </h1>
            <p style={{ fontSize: 15, color: textMuted, margin: 0, lineHeight: 1.6 }}>
              {tx.welcomeSub} <strong style={{ color: accentBlue }}>19,000+</strong> {tx.welcomeSub2}
            </p>
          </div>

          {/* Services Label */}
          <div style={{ maxWidth: 700, width: "100%", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: textMuted, margin: 0, textAlign: lang === "ar" ? "right" : "left" }}>
              {tx.servicesLabel}
            </p>
          </div>

          {/* Service Cards Grid */}
          <div style={{
            maxWidth: 700, width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}>
            {tx.services.map((svc, i) => {
              const Icon = svc.icon;
              const isLast = i === tx.services.length - 1 && tx.services.length % 2 !== 0;
              return (
                <div
                  key={i}
                  style={{
                    gridColumn: isLast ? "1 / -1" : undefined,
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "all 0.15s",
                    boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = accentBlue;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(37,99,235,0.15)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = cardBorder;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)";
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: isDark
                      ? "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)"
                      : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color={isDark ? "#93c5fd" : "#1d4ed8"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textMain, marginBottom: 2 }}>{svc.label}</div>
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

        {/* Input Area */}
        <div style={{
          padding: "16px 24px 8px",
          borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
          backgroundColor: isDark ? "#0d1117" : "#ffffff",
        }}>
          <div style={{
            maxWidth: 700, margin: "0 auto",
            backgroundColor: inputBg,
            border: `1.5px solid ${inputBorder}`,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
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
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: inputVal.length > 0
                  ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                  : isDark ? "#1e293b" : "#f1f5f9",
                border: "none",
                cursor: inputVal.length > 0 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <Send size={16} color={inputVal.length > 0 ? "#fff" : textMuted} style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }} />
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 10, color: textMuted, marginTop: 8, marginBottom: 0 }}>
            {tx.disclaimer}
          </p>
        </div>
      </main>
    </div>
  );
}
