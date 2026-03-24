import "./_group.css";
import { useState } from "react";
import {
  GraduationCap,
  Globe,
  Moon,
  Sun,
  ArrowLeft,
  ArrowRight,
  Star,
  CheckCircle,
  Users,
} from "lucide-react";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

const influencer = {
  ar: {
    name: "محمد العجمي",
    handle: "@m_alaajmi",
    quote: "اخترت Baansy لأنها الأفضل في تسجيل الجامعات — سهّلت رحلة دراستي في الخارج من اليوم الأول!",
    cta: "ابدأ رحلتك الآن",
    subCta: "مجاناً • بدون رسوم تسجيل",
    badges: ["تسجيل جامعي", "سكن طلابي", "فيزا بالضمان", "استقبال مطار"],
    stat1Label: "جامعة حول العالم",
    stat1Value: "19,000+",
    stat2Label: "طالب مسجّل",
    stat2Value: "50,000+",
    stat3Label: "سنوات خبرة",
    stat3Value: "10+",
    welcomeTop: "رحّب بك",
    welcomeMain: "بوابتك للدراسة في الخارج",
    welcomeSub: "منصة Baansy تجمع أكثر من 19,000 جامعة حول العالم في مكان واحد",
    switchLang: "EN",
    dir: "rtl" as const,
    font: "'Cairo', 'Inter', sans-serif",
    avatarSide: "right" as const,
  },
  en: {
    name: "Mohammed Al-Ajmi",
    handle: "@m_alaajmi",
    quote: "I chose Baansy because they're the best for university registration — they made my study abroad journey so easy from day one!",
    cta: "Start Your Journey Now",
    subCta: "Free • No Registration Fees",
    badges: ["University Registration", "Student Housing", "Visa Support", "Airport Pickup"],
    stat1Label: "Universities Worldwide",
    stat1Value: "19,000+",
    stat2Label: "Enrolled Students",
    stat2Value: "50,000+",
    stat3Label: "Years of Experience",
    stat3Value: "10+",
    welcomeTop: "Welcome from",
    welcomeMain: "Your Gateway to Study Abroad",
    welcomeSub: "Baansy brings together 19,000+ universities worldwide in one place",
    switchLang: "عر",
    dir: "ltr" as const,
    font: "'Inter', 'Cairo', sans-serif",
    avatarSide: "left" as const,
  },
};

const AvatarIcon = ({ size = 80, color = "#2563eb" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <circle cx="40" cy="40" r="40" fill={`${color}22`} />
    <circle cx="40" cy="30" r="14" fill={color} />
    <path
      d="M10 68c0-16.569 13.431-30 30-30s30 13.431 30 30"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="40" cy="30" r="14" fill={color} fillOpacity="0.85" />
  </svg>
);

export function ReferralPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [theme, setTheme] = useState<Theme>("light");

  const tx = influencer[lang];
  const isDark = theme === "dark";

  const bg = isDark
    ? "linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #1e1b4b 100%)"
    : "linear-gradient(135deg, #eff6ff 0%, #f0f4ff 50%, #eef2ff 100%)";
  const cardBg = isDark ? "rgba(30,41,59,0.85)" : "rgba(255,255,255,0.9)";
  const cardBorder = isDark ? "rgba(59,130,246,0.3)" : "rgba(37,99,235,0.15)";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const accentBlue = "#2563eb";
  const blueSoft = isDark ? "rgba(37,99,235,0.15)" : "#eff6ff";
  const blueText = isDark ? "#93c5fd" : "#1d4ed8";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        fontFamily: tx.font,
        direction: tx.dir,
        background: bg,
        color: textMain,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration blobs */}
      <div style={{
        position: "absolute", top: -60, right: lang === "ar" ? -60 : "auto", left: lang === "en" ? -60 : "auto",
        width: 300, height: 300, borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -80, left: lang === "ar" ? -80 : "auto", right: lang === "en" ? -80 : "auto",
        width: 400, height: 400, borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top Controls */}
      <div style={{
        position: "absolute", top: 16,
        left: lang === "ar" ? 16 : "auto",
        right: lang === "en" ? 16 : "auto",
        display: "flex", gap: 8, zIndex: 10,
      }}>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          style={{
            backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.8)",
            border: `1px solid ${cardBorder}`,
            borderRadius: 8, padding: "6px 12px",
            color: blueText, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 500, fontFamily: tx.font,
            backdropFilter: "blur(8px)",
          }}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
          {isDark ? (lang === "ar" ? "فاتح" : "Light") : (lang === "ar" ? "داكن" : "Dark")}
        </button>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          style={{
            backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.8)",
            border: `1px solid ${cardBorder}`,
            borderRadius: 8, padding: "6px 12px",
            color: blueText, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, fontFamily: tx.font,
            backdropFilter: "blur(8px)",
          }}
        >
          <Globe size={13} />
          {tx.switchLang}
        </button>
      </div>

      {/* Influencer Avatar — top right (Arabic) / top left (English) */}
      <div style={{
        position: "absolute",
        top: 16,
        right: lang === "ar" ? 20 : "auto",
        left: lang === "en" ? 20 : "auto",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexDirection: lang === "ar" ? "row-reverse" : "row",
      }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
          boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "3px solid rgba(255,255,255,0.9)",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <AvatarIcon size={52} color="#ffffff" />
        </div>
        {/* Name + badge */}
        <div>
          <div style={{
            fontWeight: 700, fontSize: 14, color: textMain,
            backgroundColor: isDark ? "rgba(30,41,59,0.85)" : "rgba(255,255,255,0.9)",
            padding: "6px 12px", borderRadius: 10,
            backdropFilter: "blur(8px)",
            border: `1px solid ${cardBorder}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {tx.name}
            <span style={{ display: "block", fontSize: 11, color: textMuted, fontWeight: 400 }}>{tx.handle}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh",
        padding: "100px 24px 40px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(37,99,235,0.4)"
          }}>
            <GraduationCap size={26} color="#fff" />
          </div>
          <span style={{
            fontSize: 28, fontWeight: 800,
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Baansy</span>
        </div>

        {/* Welcome tag */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
          backgroundColor: blueSoft,
          color: blueText,
          borderRadius: 20, padding: "6px 16px",
          fontSize: 12, fontWeight: 600,
          border: `1px solid ${isDark ? "rgba(37,99,235,0.3)" : "#bfdbfe"}`,
        }}>
          <Users size={13} />
          {tx.welcomeTop} <strong>{tx.name}</strong>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 36, fontWeight: 800, textAlign: "center",
          margin: "0 0 12px",
          lineHeight: 1.25,
          background: isDark
            ? "linear-gradient(135deg, #f1f5f9, #93c5fd)"
            : "linear-gradient(135deg, #1e293b, #1d4ed8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          {tx.welcomeMain}
        </h1>

        <p style={{ fontSize: 15, color: textMuted, textAlign: "center", maxWidth: 480, margin: "0 0 28px", lineHeight: 1.7 }}>
          {tx.welcomeSub}
        </p>

        {/* Quote Card */}
        <div style={{
          maxWidth: 560, width: "100%",
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 20,
          padding: "24px",
          marginBottom: 28,
          backdropFilter: "blur(16px)",
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(37,99,235,0.1)",
          position: "relative",
        }}>
          {/* Stars */}
          <div style={{ display: "flex", gap: 3, marginBottom: 14, justifyContent: "center" }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
          </div>

          {/* Quote text */}
          <p style={{
            fontSize: 15, lineHeight: 1.75, color: textMain,
            textAlign: "center", margin: "0 0 16px",
            fontStyle: "italic",
          }}>
            "{tx.quote}"
          </p>

          {/* Attribution */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #1d4ed8, #60a5fa)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AvatarIcon size={34} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: textMain }}>{tx.name}</div>
              <div style={{ fontSize: 11, color: blueText }}>{tx.handle}</div>
            </div>
          </div>
        </div>

        {/* Service Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32 }}>
          {tx.badges.map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 5,
              backgroundColor: blueSoft,
              color: blueText,
              borderRadius: 20, padding: "6px 14px",
              fontSize: 12, fontWeight: 600,
              border: `1px solid ${isDark ? "rgba(37,99,235,0.25)" : "#bfdbfe"}`,
            }}>
              <CheckCircle size={12} />
              {b}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 24, marginBottom: 36,
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {[
            { value: tx.stat1Value, label: tx.stat1Label },
            { value: tx.stat2Value, label: tx.stat2Label },
            { value: tx.stat3Value, label: tx.stat3Label },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 26, fontWeight: 800,
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: textMuted, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: 14,
          padding: "16px 40px",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: tx.font,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
          transition: "all 0.2s",
          marginBottom: 10,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(37,99,235,0.55)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(37,99,235,0.45)"; }}
        >
          {tx.cta}
          {lang === "ar"
            ? <ArrowLeft size={18} />
            : <ArrowRight size={18} />
          }
        </button>
        <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{tx.subCta}</p>
      </div>
    </div>
  );
}
