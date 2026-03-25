import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, streamChat } from "@/lib/api";
import {
  GraduationCap, Home as HomeIco, Heart, Plane, FileText, CreditCard, IdCard,
  MsgPlus, Moon, Sun, Globe, PanClose, PanOpen, Send, MoreH, Gear, LogOut,
  LogIn, UserPlus, UserIco, Gift, Sparkles, ChevR, Menu, X, Wifi
} from "@/components/icons";
import ServiceCard, { parseMessageParts } from "@/components/ServiceCard";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

const svcs = {
  ar: [
    { icon: GraduationCap, label: "تسجيل الجامعات", desc: "4000+ جامعة خاصة و15000+ حكومية" },
    { icon: HomeIco, label: "السكن الطلابي", desc: "إيجاد سكن قريب من جامعتك" },
    { icon: Heart, label: "التأمين الصحي", desc: "تغطية طبية شاملة للطلاب" },
    { icon: Plane, label: "استقبال من المطار", desc: "خدمة النقل وحجز التذاكر" },
    { icon: FileText, label: "تجهيز الفيزا", desc: "مساعدة كاملة في ملف الفيزا" },
    { icon: IdCard, label: "البطاقة الطلابية الدولية", desc: "خصومات حصرية حول العالم" },
    { icon: Wifi, label: "الإنترنت الدولي", desc: "شرائح SIM في 150+ دولة" },
    { icon: CreditCard, label: "كارت فيزا / ماستركارد", desc: "بطاقة مسبقة الدفع للطلاب" },
  ],
  en: [
    { icon: GraduationCap, label: "University Registration", desc: "4,000+ private & 15,000+ public" },
    { icon: HomeIco, label: "Student Housing", desc: "Find housing near your university" },
    { icon: Heart, label: "Health Insurance", desc: "Comprehensive student medical coverage" },
    { icon: Plane, label: "Airport Pickup", desc: "Transfer services & ticket booking" },
    { icon: FileText, label: "Visa Assistance", desc: "Complete help with student visa files" },
    { icon: IdCard, label: "International Student Card", desc: "Exclusive discounts worldwide" },
    { icon: Wifi, label: "International Internet", desc: "SIM cards in 150+ countries" },
    { icon: CreditCard, label: "Visa / Mastercard", desc: "Prepaid card for students" },
  ],
};

const T = {
  ar: {
    dir: "rtl" as const, font: "'Cairo','Inter',sans-serif",
    logo: "Baansy", tagline: "منصة التسجيل الجامعي الذكية",
    newChat: "+ محادثة جديدة", todayLabel: "اليوم",
    welcomeTitle: "مرحباً بك في Baansy",
    welcomeSub: "منصتك الذكية للتسجيل في أكثر من", welcomeSub2: "جامعة حول العالم",
    inputPH: "اكتب رسالتك...", servicesLabel: "كيف يمكنني مساعدتك؟",
    disclaimer: "قد يقدم Baansy AI معلومات غير دقيقة · إشعار الخصوصية",
    swLang: "EN", loginBtn: "تسجيل الدخول", signupBtn: "إنشاء حساب",
    settingsBtn: "الإعدادات", logoutBtn: "تسجيل الخروج",
    themeLight: "فاتح", themeDark: "داكن", colTip: "طي القائمة", expTip: "عرض القائمة",
    referralLink: "برنامج الإحالة",
    universitiesLink: "استكشف الجامعات",
    documentsLink: "وثائقي",
    applicationsLink: "طلباتي",
    stat1: "4,000+ جامعة خاصة", stat2: "15,000+ جامعة حكومية",
    assistantLabel: "مساعد Baansy الذكي",
    you: "أنت", thinking: "يفكر...",
    newSession: "محادثة جديدة",
    adminPanel: "لوحة التحكم",
  },
  en: {
    dir: "ltr" as const, font: "'Inter','Cairo',sans-serif",
    logo: "Baansy", tagline: "Smart University Registration Platform",
    newChat: "+ New Chat", todayLabel: "Today",
    welcomeTitle: "Welcome to Baansy",
    welcomeSub: "Your smart platform for registering in over", welcomeSub2: "universities worldwide",
    inputPH: "Type your message...", servicesLabel: "How can I help you today?",
    disclaimer: "Baansy AI may provide inaccurate information · Privacy Notice",
    swLang: "عر", loginBtn: "Login", signupBtn: "Sign Up",
    settingsBtn: "Settings", logoutBtn: "Logout",
    themeLight: "Light", themeDark: "Dark", colTip: "Collapse sidebar", expTip: "Expand sidebar",
    referralLink: "Referral Program",
    universitiesLink: "Explore Universities",
    documentsLink: "My Documents",
    applicationsLink: "My Applications",
    stat1: "4,000+ Private", stat2: "15,000+ Public",
    assistantLabel: "Baansy AI Assistant",
    you: "You", thinking: "Thinking...",
    newSession: "New Chat",
    adminPanel: "Admin Panel",
  },
};

interface ChatMsg { id: number; role: "user" | "assistant"; content: string; }
interface Session { id: number; title?: string | null; createdAt: string; }

interface Props {
  lang: Lang; setLang: (l: Lang) => void;
  theme: Theme; setTheme: (t: Theme) => void;
  navigate: (p: string) => void;
  isMobile: boolean;
}

export default function HomePage({ lang, setLang, theme, setTheme, navigate, isMobile }: Props) {
  const { user, logout, isAdmin } = useAuth();
  const tx = T[lang]; const isDark = theme === "dark"; const services = svcs[lang];

  const bg = isDark ? "#0d1117" : "#f8faff";
  const sidebarBg = isDark ? "#0f172a" : "#eef2ff";
  const sidebarBorder = isDark ? "#1e293b" : "#c7d2fe";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "#1e293b" : "#fff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#1e293b" : "#fff";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";
  const accentBlue = "#2563eb";
  const accentBlueSoft = isDark ? "#1d4ed820" : "#eff6ff";
  const accentBlueText = isDark ? "#93c5fd" : "#1d4ed8";
  const ctrlBg = isDark ? "#1e293b" : "#dbeafe";
  const ctrlColor = isDark ? "#93c5fd" : "#1d4ed8";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [typingSpeed] = useState(20);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
      const fetchUnread = () => {
        api.get<{ count: number }>("/notifications/count").then(r => setUnreadCount(r.count)).catch(() => {});
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const s = await api.get<Session[]>("/chat/sessions");
      setSessions(s);
      if (s.length > 0 && !currentSession) {
        setCurrentSession(s[s.length - 1].id);
        loadMessages(s[s.length - 1].id);
      }
    } catch { }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const msgs = await api.get<ChatMsg[]>(`/chat/sessions/${sessionId}/messages`);
      setMessages(msgs);
    } catch { }
  };

  const newSession = async () => {
    if (!user) { navigate("login"); return; }
    try {
      const s = await api.post<Session>("/chat/sessions");
      setSessions(prev => [...prev, s]);
      setCurrentSession(s.id);
      setMessages([]);
    } catch { }
  };

  const selectSession = (id: number) => {
    setCurrentSession(id);
    loadMessages(id);
    if (isMobile) setDrawerOpen(false);
  };

  const sendMessage = useCallback(async () => {
    const content = inputVal.trim();
    if (!content || streaming) return;

    if (!user) { navigate("login"); return; }

    let sessionId = currentSession;
    if (!sessionId) {
      try {
        const s = await api.post<Session>("/chat/sessions");
        setSessions(prev => [...prev, s]);
        setCurrentSession(s.id);
        sessionId = s.id;
        setMessages([]);
      } catch { return; }
    }

    const userMsg: ChatMsg = { id: Date.now(), role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setStreaming(true);

    const assistantMsg: ChatMsg = { id: Date.now() + 1, role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    let accum = "";
    try {
      await streamChat(
        sessionId,
        content,
        (chunk) => {
          accum += chunk;
          setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: accum } : m));
        },
        () => setStreaming(false),
      );
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: "حدث خطأ. حاول مرة أخرى." } : m));
      setStreaming(false);
    }
  }, [inputVal, streaming, user, currentSession]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const serviceMessages: Record<string, string> = {
    "السكن الطلابي": "أريد الاستفسار عن خيارات السكن الطلابي المتاحة",
    "Student Housing": "I'd like to learn about student housing options",
    "التأمين الصحي": "ما هي خيارات التأمين الصحي المتاحة للطلاب؟",
    "Health Insurance": "What health insurance options are available for students?",
    "استقبال من المطار": "أريد حجز خدمة استقبال من المطار",
    "Airport Pickup": "I'd like to book an airport pickup service",
    "تجهيز الفيزا": "أحتاج مساعدة في متطلبات التأشيرة الدراسية",
    "Visa Assistance": "I need help with student visa requirements",
    "البطاقة الطلابية الدولية": "ما هي مميزات البطاقة الطلابية الدولية ISIC؟",
    "International Student Card": "What are the benefits of the ISIC international student card?",
    "كارت فيزا / ماستركارد": "أريد الاستفسار عن بطاقة Visa/Mastercard مسبقة الدفع للطلاب",
    "Visa / Mastercard": "I'd like to request a prepaid Visa/Mastercard for students",
    "الإنترنت الدولي": "ما هي خيارات الإنترنت والشرائح الدولية للطلاب في الخارج؟",
    "International Internet": "What are the international internet and SIM card options for students abroad?",
  };

  const handleServiceClick = (svc: any) => {
    const label: string = svc.label;
    if (label === "تسجيل الجامعات" || label === "University Registration") {
      navigate("universities");
      return;
    }
    if (!user) { navigate("login"); return; }
    const msg = serviceMessages[label] || label;
    setInputVal(msg);
    inputRef.current?.focus();
  };

  const showWelcome = messages.length === 0;

  const SidebarContent = () => (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 16px", borderBottom: `1px solid ${sidebarBorder}`, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(37,99,235,.35)" }}><GraduationCap size={20} color="#fff" /></div>
        <div style={{ overflow: "hidden" }}><div style={{ fontWeight: 700, fontSize: 16, color: textMain, whiteSpace: "nowrap" }}>{tx.logo}</div><div style={{ fontSize: 10, color: textMuted, whiteSpace: "nowrap" }}>{tx.tagline}</div></div>
      </div>
      <button onClick={newSession} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontFamily: tx.font, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 4, flexShrink: 0, boxShadow: "0 2px 8px rgba(37,99,235,.3)", whiteSpace: "nowrap" }}>
        <MsgPlus size={16} />{tx.newChat}
      </button>
      <div style={{ marginTop: 8, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px 8px", whiteSpace: "nowrap" }}>{tx.todayLabel}</div>
        {sessions.map(s => (
          <div key={s.id} onClick={() => selectSession(s.id)} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: s.id === currentSession ? accentBlue : textMuted, backgroundColor: s.id === currentSession ? accentBlueSoft : "transparent", display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}>
            <MsgPlus size={14} style={{ flexShrink: 0 }} /><span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title || tx.newSession}</span><MoreH size={14} style={{ opacity: .4, flexShrink: 0 }} />
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, paddingTop: 12, borderTop: `1px solid ${sidebarBorder}` }}>
        <button onClick={() => navigate("universities")} style={{ backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap" }}>
          <GraduationCap size={14} />{tx.universitiesLink}
        </button>
        {user && (
          <>
            <button onClick={() => navigate("documents")} style={{ backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap" }}>
              <FileText size={14} />{tx.documentsLink}
            </button>
            <button onClick={() => navigate("applications")} style={{ backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap", position: "relative" }}>
              <GraduationCap size={14} />{tx.applicationsLink}
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 4, insetInlineEnd: 4, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </>
        )}
        <button onClick={() => navigate("referral")} style={{ backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap" }}>
          <Gift size={14} />{tx.referralLink}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ flex: 1, backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 500, fontFamily: tx.font, whiteSpace: "nowrap" }}>
            {isDark ? <Sun size={13} /> : <Moon size={13} />}{isDark ? tx.themeLight : tx.themeDark}
          </button>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ flex: 1, backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap" }}>
            <Globe size={13} />{tx.swLang}
          </button>
        </div>
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", backgroundColor: accentBlueSoft, borderRadius: 9, border: `1px solid ${isDark ? "#1d4ed830" : "#bfdbfe"}` }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#1d4ed8,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserIco size={14} color="#fff" /></div>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: accentBlueText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {isAdmin && (
                <button onClick={() => navigate("admin")} style={{ flex: 1, backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "8px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap" }}>
                  <Gear size={13} />{tx.adminPanel}
                </button>
              )}
              <button onClick={() => { logout(); setMessages([]); setSessions([]); setCurrentSession(null); }} style={{ flex: 1, backgroundColor: isDark ? "#2d1515" : "#fff1f2", color: isDark ? "#f87171" : "#dc2626", border: `1px solid ${isDark ? "#7f1d1d40" : "#fecaca"}`, borderRadius: 8, padding: "8px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap" }}>
                <LogOut size={13} />{tx.logoutBtn}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("login")} style={{ flex: 1, backgroundColor: ctrlBg, color: ctrlColor, border: "none", borderRadius: 8, padding: "9px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 500, fontFamily: tx.font, whiteSpace: "nowrap" }}><LogIn size={13} />{tx.loginBtn}</button>
            <button onClick={() => navigate("signup")} style={{ flex: 1, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 600, fontFamily: tx.font, whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(37,99,235,.3)" }}><UserPlus size={13} />{tx.signupBtn}</button>
          </div>
        )}
      </div>
    </>
  );

  const ChatArea = () => (
    <>
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px 8px" : "40px 24px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {showWelcome ? (
          <>
            <div style={{ maxWidth: 700, width: "100%", textAlign: "center", marginBottom: isMobile ? 18 : 40 }}>
              <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: 20, background: "linear-gradient(135deg,#1d4ed8,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(37,99,235,.35)" }}><GraduationCap size={isMobile ? 24 : 30} color="#fff" /></div>
              <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{tx.welcomeTitle}</h1>
              <p style={{ fontSize: isMobile ? 12 : 15, color: textMuted, margin: 0, lineHeight: 1.6 }}>{tx.welcomeSub} <strong style={{ color: accentBlue }}>19,000+</strong> {tx.welcomeSub2}</p>
            </div>
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12, fontSize: 11, color: textMuted, fontWeight: 500, width: "100%", justifyContent: lang === "ar" ? "flex-end" : "flex-start" }}>
                <Sparkles size={12} color={accentBlue} />{tx.assistantLabel}
              </div>
            )}
            <div style={{ maxWidth: 700, width: "100%", marginBottom: 16 }}>
              <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: textMuted, margin: 0, textAlign: lang === "ar" ? "right" : "left" }}>{tx.servicesLabel}</p>
            </div>
            <div style={{ maxWidth: 700, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? 8 : 12 }}>
              {services.map((svc, i) => {
                const Ic = svc.icon; const isLast = i === services.length - 1 && services.length % 2 !== 0;
                return (
                  <div key={i} onClick={() => handleServiceClick(svc)} style={{ gridColumn: isLast ? "1 / -1" : undefined, backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: isMobile ? "11px 10px" : "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all .15s", boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,.06)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = accentBlue; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = cardBorder; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
                    <div style={{ width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: 10, flexShrink: 0, background: isDark ? "linear-gradient(135deg,#1e3a8a,#1d4ed8)" : "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic size={isMobile ? 18 : 20} color={isDark ? "#93c5fd" : "#1d4ed8"} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: textMain, marginBottom: 2 }}>{svc.label}</div>
                      <div style={{ fontSize: 11, color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{svc.desc}</div>
                    </div>
                    <ChevR size={14} color={textMuted} style={{ transform: lang === "ar" ? "rotate(180deg)" : "none", flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: 700, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: "flex", flexDirection: msg.role === "user" ? (lang === "ar" ? "row" : "row-reverse") : (lang === "ar" ? "row-reverse" : "row"), gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: msg.role === "user" ? "linear-gradient(135deg,#c2410c,#fb923c)" : isDark ? "#1e293b" : "#f0f4ff", border: msg.role === "assistant" ? `1px solid ${isDark ? "#334155" : "#c7d2fe"}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {msg.role === "user" ? <UserIco size={16} color="#fff" /> : <GraduationCap size={16} color={isDark ? "#93c5fd" : "#1d4ed8"} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {msg.role === "user" ? (
                    <div style={{ backgroundColor: isDark ? "rgba(251,146,60,0.18)" : "rgba(251,146,60,0.14)", border: `1px solid ${isDark ? "rgba(251,146,60,0.3)" : "rgba(251,146,60,0.35)"}`, borderRadius: 14, padding: "10px 14px", fontSize: 14, color: isDark ? "#fed7aa" : "#7c2d12", lineHeight: 1.7, fontFamily: tx.font, direction: tx.dir, textAlign: lang === "ar" ? "right" : "left", whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div>
                      {msg.content ? (
                        parseMessageParts(msg.content).map((part, pi) =>
                          part.type === "card" ? (
                            <ServiceCard key={pi} type={part.value} lang={lang} theme={theme} />
                          ) : (
                            <div key={pi} style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: "10px 14px", fontSize: 14, color: textMain, lineHeight: 1.7, fontFamily: tx.font, direction: tx.dir, textAlign: lang === "ar" ? "right" : "left", whiteSpace: "pre-wrap", marginBottom: 4 }}>
                              {part.value}
                            </div>
                          )
                        )
                      ) : (
                        streaming && <div style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: "10px 14px", fontSize: 14, color: textMain, fontFamily: tx.font }}><span style={{ opacity: .5 }}>{tx.thinking}</span></div>
                      )}
                      {msg.role === "assistant" && streaming && msg.content && (
                        <span style={{ display: "inline-block", width: 2, height: 16, backgroundColor: accentBlue, marginInlineStart: 2, animation: "blink 1s infinite", verticalAlign: "middle" }} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div style={{ padding: isMobile ? "12px 12px 8px" : "16px 24px 8px", borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`, backgroundColor: isDark ? "#0d1117" : "#fff", flexShrink: 0 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", backgroundColor: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", boxShadow: isDark ? "0 0 0 1px #334155" : "0 2px 8px rgba(0,0,0,.08)" }}>
          <input ref={inputRef} type="text" placeholder={tx.inputPH} value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleKey}
            style={{ flex: 1, border: "none", backgroundColor: "transparent", color: textMain, fontFamily: tx.font, fontSize: 14, direction: tx.dir, textAlign: lang === "ar" ? "right" : "left", outline: "none" }} />
          <button onClick={sendMessage} disabled={streaming} style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, border: "none", background: inputVal.length > 0 ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : isDark ? "#1e293b" : "#f1f5f9", cursor: inputVal.length > 0 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
            <Send size={16} color={inputVal.length > 0 ? "#fff" : textMuted} style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 10, color: textMuted, marginTop: 8, marginBottom: 0 }}>{tx.disclaimer}</p>
      </div>
    </>
  );

  if (isMobile) {
    const topBg = isDark ? "#0f172a" : "#fff";
    const topBorder = isDark ? "#1e293b" : "#c7d2fe";
    const accentBlueSoftM = isDark ? "#1d4ed820" : "#eff6ff";
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", fontFamily: tx.font, direction: tx.dir, backgroundColor: bg, color: textMain, overflow: "hidden", position: "relative" }}>
        {drawerOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", flexDirection: lang === "ar" ? "row-reverse" : "row" }}>
            <div onClick={() => setDrawerOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,.45)" }} />
            <div style={{ width: 280, backgroundColor: sidebarBg, borderLeft: lang === "ar" ? "none" : `1px solid ${sidebarBorder}`, borderRight: lang === "ar" ? `1px solid ${sidebarBorder}` : "none", display: "flex", flexDirection: "column", padding: "0 0 16px", height: "100vh", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 14px", borderBottom: `1px solid ${sidebarBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={18} color="#fff" /></div>
                  <div><div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>Baansy</div><div style={{ fontSize: 9, color: textMuted }}>{tx.tagline}</div></div>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, padding: 4 }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 12px 0", gap: 8, overflow: "hidden" }}>
                {SidebarContent()}
              </div>
            </div>
          </div>
        )}
        <div style={{ backgroundColor: topBg, borderBottom: `1px solid ${topBorder}`, flexShrink: 0, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", direction: "ltr" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[T[lang].stat1, T[lang].stat2].map((s, i) => (
              <div key={i} style={{ backgroundColor: accentBlueSoftM, border: `1px solid ${isDark ? "#1d4ed830" : "#bfdbfe"}`, borderRadius: 8, padding: "4px 8px", fontSize: 9.5, fontWeight: 600, color: accentBlueText, whiteSpace: "nowrap", fontFamily: tx.font }}>{s}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: textMain, fontFamily: tx.font }}>Baansy</div>
              <div style={{ fontSize: 8, color: textMuted, fontFamily: tx.font, whiteSpace: "nowrap" }}>{tx.tagline}</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={17} color="#fff" /></div>
            <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, padding: 4 }}><Menu size={22} color={textMain} /></button>
          </div>
        </div>
        {ChatArea()}
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", fontFamily: tx.font, direction: tx.dir, backgroundColor: bg, color: textMain, overflow: "hidden" }}>
      <div style={{ position: "relative", flexShrink: 0, order: lang === "ar" ? 1 : 0 }}>
        <button onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? tx.colTip : tx.expTip}
          style={{ position: "absolute", top: 68, right: lang === "ar" ? undefined : -28, left: lang === "ar" ? -28 : undefined, width: 28, height: 52, borderRadius: lang === "ar" ? "10px 0 0 10px" : "0 10px 10px 0", backgroundColor: sidebarBg, borderTop: `1px solid ${sidebarBorder}`, borderBottom: `1px solid ${sidebarBorder}`, borderLeft: lang === "ar" ? `1px solid ${sidebarBorder}` : "none", borderRight: lang === "ar" ? "none" : `1px solid ${sidebarBorder}`, color: textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, boxShadow: "2px 2px 6px rgba(0,0,0,.08)" }}>
          {sidebarOpen ? <PanClose size={15} /> : <PanOpen size={15} />}
        </button>
        <aside style={{ width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, overflow: "hidden", backgroundColor: sidebarBg, borderLeft: lang === "ar" ? "none" : `1px solid ${sidebarBorder}`, borderRight: lang === "ar" ? `1px solid ${sidebarBorder}` : "none", display: "flex", flexDirection: "column", padding: sidebarOpen ? "16px 12px" : "0", gap: 8, transition: "width .25s cubic-bezier(.4,0,.2,1),min-width .25s,padding .2s", flexShrink: 0, height: "100vh" }}>
          {SidebarContent()}
        </aside>
      </div>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: bg, minWidth: 0 }}>
        {ChatArea()}
      </main>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
