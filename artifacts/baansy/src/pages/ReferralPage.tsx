import { Star, Users, GraduationCap, ArrL, ArrR } from "@/components/icons";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

const T = {
  ar: {
    dir: "rtl" as const, font: "'Cairo','Inter',sans-serif",
    refName: "محمد العجمي", refHandle: "@m_alaajmi",
    refQuote: "اخترت Baansy لأنها الأفضل في تسجيل الجامعات — سهّلت رحلة دراستي في الخارج من اليوم الأول!",
    refCta: "ابدأ رحلتك الآن", refSubCta: "مجاناً • بدون رسوم تسجيل",
    refBadges: ["تسجيل جامعي", "سكن طلابي", "فيزا بالضمان", "استقبال مطار"],
    refStat1V: "19,000+", refStat1L: "جامعة حول العالم",
    refStat2V: "50,000+", refStat2L: "طالب مسجّل",
    refStat3V: "10+", refStat3L: "سنوات خبرة",
    refWTop: "رحّب بك", refMain: "بوابتك للدراسة في الخارج",
    refSub: "منصة Baansy تجمع أكثر من 19,000 جامعة حول العالم في مكان واحد",
    back: "العودة",
    tagline: "منصة التسجيل الجامعي الذكية",
  },
  en: {
    dir: "ltr" as const, font: "'Inter','Cairo',sans-serif",
    refName: "Mohammed Al-Ajmi", refHandle: "@m_alaajmi",
    refQuote: "I chose Baansy because they're the best for university registration — they made my study abroad journey so easy from day one!",
    refCta: "Start Your Journey Now", refSubCta: "Free • No Registration Fees",
    refBadges: ["University Registration", "Student Housing", "Visa Support", "Airport Pickup"],
    refStat1V: "19,000+", refStat1L: "Universities Worldwide",
    refStat2V: "50,000+", refStat2L: "Enrolled Students",
    refStat3V: "10+", refStat3L: "Years of Experience",
    refWTop: "Welcome from", refMain: "Your Gateway to Study Abroad",
    refSub: "Baansy brings together 19,000+ universities worldwide in one place",
    back: "Back",
    tagline: "Smart University Registration Platform",
  },
};

export default function ReferralPage({ lang, theme, navigate }: { lang: Lang; theme: Theme; navigate: (p: string) => void }) {
  const tx = T[lang]; const isDark = theme === "dark";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "rgba(30,41,59,.8)" : "rgba(255,255,255,.85)";
  const border = isDark ? "#334155" : "#e2e8f0";

  return (
    <div style={{ minHeight: "100vh", fontFamily: tx.font, direction: tx.dir, color: textMain, position: "relative", overflow: "auto", background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 50%,#1d4ed8 100%)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.15) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(0,0,0,.15) 0%,transparent 60%)" }} />

      <button onClick={() => navigate("home")} style={{ position: "fixed", top: 16, left: lang === "ar" ? undefined : 16, right: lang === "ar" ? 16 : undefined, background: "rgba(255,255,255,.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 12, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: tx.font, display: "flex", alignItems: "center", gap: 6, zIndex: 10 }}>
        {lang === "ar" ? <ArrR size={14} /> : <ArrL size={14} />}{tx.back}
      </button>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 20px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,.2)", borderRadius: 100, padding: "6px 16px", border: "1px solid rgba(255,255,255,.3)", marginBottom: 16, backdropFilter: "blur(8px)" }}>
            <GraduationCap size={14} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{tx.refWTop}</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 12px", textShadow: "0 2px 10px rgba(0,0,0,.2)", lineHeight: 1.2 }}>{tx.refMain}</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.85)", lineHeight: 1.6 }}>{tx.refSub}</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
          {tx.refBadges.map((b, i) => (
            <div key={i} style={{ backgroundColor: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.35)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#fff", backdropFilter: "blur(8px)" }}>{b}</div>
          ))}
        </div>

        <div style={{ backgroundColor: cardBg, backdropFilter: "blur(20px)", borderRadius: 20, padding: 24, border: `1px solid ${border}`, marginBottom: 20, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexDirection: lang === "ar" ? "row-reverse" : "row" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>👤</div>
            <div style={{ textAlign: lang === "ar" ? "right" : "left" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: textMain }}>{tx.refName}</div>
              <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>{tx.refHandle}</div>
            </div>
            <div style={{ marginInlineStart: "auto", display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} color="#f59e0b" />)}
            </div>
          </div>
          <p style={{ fontSize: 14, color: textMain, lineHeight: 1.7, margin: 0, fontStyle: "italic", textAlign: lang === "ar" ? "right" : "left" }}>"{tx.refQuote}"</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
          {[
            { v: tx.refStat1V, l: tx.refStat1L },
            { v: tx.refStat2V, l: tx.refStat2L },
            { v: tx.refStat3V, l: tx.refStat3L },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "16px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,.25)" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{stat.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.8)", marginTop: 4, fontWeight: 500 }}>{stat.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 12 }}>
          <Users size={14} color="rgba(255,255,255,.7)" />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>Baansy</span>
        </div>

        <button onClick={() => navigate("signup")} style={{ width: "100%", padding: "16px", background: "#fff", color: "#1d4ed8", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: tx.font, boxShadow: "0 8px 24px rgba(0,0,0,.2)", marginBottom: 10, transition: "transform .15s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
          {tx.refCta}
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.75)", margin: 0 }}>{tx.refSubCta}</p>
      </div>
    </div>
  );
}
