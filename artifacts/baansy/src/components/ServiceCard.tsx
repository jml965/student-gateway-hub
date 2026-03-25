import { useState } from "react";
import { api } from "@/lib/api";

type Lang = "ar" | "en";
type Theme = "light" | "dark";

interface ServiceCardProps {
  type: string;
  lang: Lang;
  theme: Theme;
  onServiceRequested?: (type: string) => void;
}

const T = {
  ar: {
    housing: {
      title: "السكن الطلابي",
      subtitle: "سكن مريح وآمن قريب من جامعتك",
      options: [
        { label: "شقة مفروشة", desc: "مطبخ وأثاث كامل", price: "من $150/شهر", badge: "الأكثر طلباً", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80" },
        { label: "غرفة طلابية", desc: "مبنى طلابي متكامل", price: "من $80/شهر", badge: "", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80" },
        { label: "استوديو خاص", desc: "خصوصية تامة واستقلالية", price: "من $200/شهر", badge: "فاخر", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80" },
      ],
      cta: "استعرض خيارات السكن",
      link: "https://housing.baansy.com",
    },
    insurance: {
      title: "التأمين الصحي الطلابي",
      subtitle: "تغطية طبية شاملة في 40+ دولة",
      options: [
        { label: "الخطة الأساسية", desc: "طوارئ + عيادات خارجية", price: "30$/شهر", badge: "" },
        { label: "الخطة المتوسطة", desc: "+ أسنان + بصريات", price: "60$/شهر", badge: "موصى به" },
        { label: "الخطة الشاملة", desc: "تغطية كاملة بدون استثناء", price: "100$/شهر", badge: "" },
      ],
      cta: "احصل على التأمين الآن",
      link: "https://insurance.baansy.com",
    },
    travel: {
      title: "حجز الرحلات الطلابي",
      subtitle: "خصومات طلابية حصرية تصل 30%",
      options: [
        { label: "تذاكر طيران", desc: "أرخص الأسعار لأكثر من 500 وجهة", price: "خصم حتى 30%", badge: "حصري" },
        { label: "حجز فنادق", desc: "أسعار طلابية مخصصة", price: "خصم حتى 25%", badge: "" },
        { label: "تأشيرات السفر", desc: "مساعدة في إجراءات السفر", price: "مجاني مع الحجز", badge: "" },
      ],
      cta: "ابحث عن أرخص الأسعار",
      link: "https://travel.baansy.com",
    },
    student_card: {
      title: "البطاقة الطلابية الدولية ISIC",
      subtitle: "150,000+ خصم حول العالم",
      options: [
        { label: "مطاعم وكافيهات", desc: "خصم 10-30% في آلاف المطاعم", price: "", badge: "" },
        { label: "متاحف وترفيه", desc: "دخول مجاني أو مخفض لأبرز المعالم", price: "", badge: "" },
        { label: "مواصلات", desc: "خصومات على القطارات والحافلات", price: "", badge: "" },
      ],
      cta: "احصل على بطاقتك - 20$/سنة",
      link: "https://www.isic.org",
    },
    internet: {
      title: "الإنترنت الدولي للطلاب",
      subtitle: "تغطية في 150+ دولة",
      options: [
        { label: "شريحة SIM فيزيائية", desc: "تصل إلى بابك قبل سفرك", price: "من 15$/شهر", badge: "" },
        { label: "eSIM رقمية", desc: "فعّلها فوراً بدون انتظار", price: "من 12$/شهر", badge: "الأسرع" },
        { label: "باقة البيانات", desc: "20GB+ للطلاب شهرياً", price: "من 25$/شهر", badge: "الأوفر" },
      ],
      cta: "اطلب شريحتك الآن",
      link: "https://sim.baansy.com",
    },
    airport_pickup: {
      title: "استقبال من المطار",
      subtitle: "نقل آمن وموثوق إلى وجهتك",
      flightLabel: "رقم الرحلة",
      flightPH: "مثال: TK123",
      dateLabel: "تاريخ الوصول",
      addressLabel: "عنوان الوجهة",
      addressPH: "اسم الجامعة أو السكن",
      submitBtn: "اطلب الاستقبال",
      successMsg: "✅ تم استلام طلبك! سيتواصل معك فريقنا خلال 24 ساعة.",
      from: "الأسعار من 30$ للرحلة",
    },
    prepaid_card: {
      title: "بطاقة Visa/Mastercard مسبقة الدفع",
      subtitle: "بطاقة بنكية دولية للطلاب في الخارج",
      nameLabel: "الاسم الكامل (كما في الجواز)",
      namePH: "الاسم الرباعي",
      passportLabel: "رقم جواز السفر",
      passportPH: "مثال: A12345678",
      addressLabel: "عنوان السكن الدراسي",
      addressPH: "العنوان الكامل",
      amountLabel: "مبلغ التعبئة الأولي",
      ibanLabel: "IBAN للتعبئة اللاحقة (اختياري)",
      ibanPH: "SAXXXXXXXX",
      submitBtn: "تقديم طلب البطاقة",
      successMsg: "✅ تم استلام طلب البطاقة! سيتواصل معك فريقنا خلال 3 أيام عمل.",
      amounts: ["50$", "100$", "200$", "500$", "1000$"],
      note: "البطاقة تصلك إلى عنوانك الدراسي خلال 7-14 يوم عمل",
    },
  },
  en: {
    housing: {
      title: "Student Housing",
      subtitle: "Comfortable & safe housing near your university",
      options: [
        { label: "Furnished Apartment", desc: "Full kitchen & furniture", price: "From $150/mo", badge: "Most Popular", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80" },
        { label: "Student Room", desc: "Fully-equipped student building", price: "From $80/mo", badge: "", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80" },
        { label: "Private Studio", desc: "Full privacy & independence", price: "From $200/mo", badge: "Premium", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80" },
      ],
      cta: "Browse Housing Options",
      link: "https://housing.baansy.com",
    },
    insurance: {
      title: "Student Health Insurance",
      subtitle: "Comprehensive medical coverage in 40+ countries",
      options: [
        { label: "Basic Plan", desc: "Emergency + outpatient clinics", price: "$30/mo", badge: "" },
        { label: "Standard Plan", desc: "+ Dental & vision coverage", price: "$60/mo", badge: "Recommended" },
        { label: "Premium Plan", desc: "Full coverage, no exclusions", price: "$100/mo", badge: "" },
      ],
      cta: "Get Insured Now",
      link: "https://insurance.baansy.com",
    },
    travel: {
      title: "Student Travel Booking",
      subtitle: "Exclusive student discounts up to 30%",
      options: [
        { label: "Flight Tickets", desc: "Best prices to 500+ destinations", price: "Up to 30% off", badge: "Exclusive" },
        { label: "Hotel Booking", desc: "Student-specific rates", price: "Up to 25% off", badge: "" },
        { label: "Travel Visas", desc: "Assistance with travel procedures", price: "Free with booking", badge: "" },
      ],
      cta: "Find Cheapest Prices",
      link: "https://travel.baansy.com",
    },
    student_card: {
      title: "ISIC International Student Card",
      subtitle: "150,000+ discounts worldwide",
      options: [
        { label: "Restaurants & Cafes", desc: "10-30% off at thousands of restaurants", price: "", badge: "" },
        { label: "Museums & Entertainment", desc: "Free or discounted entry to top attractions", price: "", badge: "" },
        { label: "Transportation", desc: "Discounts on trains and buses", price: "", badge: "" },
      ],
      cta: "Get Your Card - $20/year",
      link: "https://www.isic.org",
    },
    internet: {
      title: "International Internet for Students",
      subtitle: "Coverage in 150+ countries",
      options: [
        { label: "Physical SIM Card", desc: "Delivered to you before you travel", price: "From $15/mo", badge: "" },
        { label: "Digital eSIM", desc: "Activate instantly, no waiting", price: "From $12/mo", badge: "Fastest" },
        { label: "Data Package", desc: "20GB+ for students monthly", price: "From $25/mo", badge: "Best Value" },
      ],
      cta: "Order Your SIM Now",
      link: "https://sim.baansy.com",
    },
    airport_pickup: {
      title: "Airport Pickup Service",
      subtitle: "Safe & reliable transfer to your destination",
      flightLabel: "Flight Number",
      flightPH: "e.g. TK123",
      dateLabel: "Arrival Date",
      addressLabel: "Destination Address",
      addressPH: "University name or accommodation",
      submitBtn: "Request Pickup",
      successMsg: "✅ Request received! Our team will contact you within 24 hours.",
      from: "Prices from $30 per trip",
    },
    prepaid_card: {
      title: "Prepaid Visa/Mastercard",
      subtitle: "International prepaid card for students abroad",
      nameLabel: "Full Name (as in passport)",
      namePH: "Your full name",
      passportLabel: "Passport Number",
      passportPH: "e.g. A12345678",
      addressLabel: "Study Accommodation Address",
      addressPH: "Full address",
      amountLabel: "Initial Load Amount",
      ibanLabel: "IBAN for future top-ups (optional)",
      ibanPH: "SAXXXXXXXX",
      submitBtn: "Submit Card Request",
      successMsg: "✅ Card request received! Our team will contact you within 3 business days.",
      amounts: ["$50", "$100", "$200", "$500", "$1000"],
      note: "Card delivered to your study address within 7-14 business days",
    },
  },
};

export function parseMessageParts(content: string): Array<{ type: "text" | "card"; value: string }> {
  const cardRegex = /\[CARD:([a-z_]+)\]/g;
  const parts: Array<{ type: "text" | "card"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) parts.push({ type: "text", value: text });
    }
    parts.push({ type: "card", value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) parts.push({ type: "text", value: text });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: content }];
}

export default function ServiceCard({ type, lang, theme, onServiceRequested }: ServiceCardProps) {
  const isDark = theme === "dark";
  const isRTL = lang === "ar";
  const tx = T[lang];

  const cardBg = isDark ? "#1e293b" : "#fff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const accentBlue = "#2563eb";
  const accentBlueSoft = isDark ? "#1d4ed820" : "#eff6ff";
  const accentBlueText = isDark ? "#93c5fd" : "#1d4ed8";
  const inputBg = isDark ? "#0f172a" : "#f8fafc";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";
  const font = isRTL ? "'Cairo','Inter',sans-serif" : "'Inter','Cairo',sans-serif";

  const containerStyle: React.CSSProperties = {
    backgroundColor: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: 14,
    padding: "16px",
    marginTop: 6,
    fontFamily: font,
    direction: isRTL ? "rtl" : "ltr",
    boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,.07)",
    maxWidth: "100%",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: accentBlueText,
    margin: "0 0 4px",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 12,
    color: textMuted,
    margin: "0 0 14px",
  };

  const optionRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 0",
    borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
  };

  const ctaBtn: React.CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: 12,
    padding: "10px 16px",
    background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    fontFamily: font,
    boxShadow: "0 2px 8px rgba(37,99,235,.3)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    color: textMain,
    fontFamily: font,
    direction: isRTL ? "rtl" : "ltr",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: textMuted,
    marginBottom: 4,
    display: "block",
  };

  if (type === "airport_pickup") {
    const ap = tx.airport_pickup;
    return <AirportPickupCard ap={ap} containerStyle={containerStyle} titleStyle={titleStyle} subtitleStyle={subtitleStyle} inputStyle={inputStyle} labelStyle={labelStyle} ctaBtn={ctaBtn} isDark={isDark} textMuted={textMuted} cardBorder={cardBorder} accentBlueSoft={accentBlueSoft} accentBlueText={accentBlueText} onServiceRequested={onServiceRequested} />;
  }

  if (type === "prepaid_card") {
    const pc = tx.prepaid_card;
    return <PrepaidCardForm pc={pc} containerStyle={containerStyle} titleStyle={titleStyle} subtitleStyle={subtitleStyle} inputStyle={inputStyle} labelStyle={labelStyle} ctaBtn={ctaBtn} isDark={isDark} textMuted={textMuted} cardBorder={cardBorder} accentBlueSoft={accentBlueSoft} accentBlueText={accentBlueText} onServiceRequested={onServiceRequested} font={font} />;
  }

  const svc = tx[type as keyof typeof tx] as typeof tx.housing | undefined;
  if (!svc || !("options" in svc)) return null;

  const hasImages = svc.options.some((o) => (o as any).img);

  if (hasImages) {
    return (
      <div style={{ fontFamily: font, direction: isRTL ? "rtl" : "ltr", marginTop: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: accentBlueText, margin: "0 0 2px" }}>{svc.title}</p>
        <p style={{ fontSize: 11, color: textMuted, margin: "0 0 10px" }}>{svc.subtitle}</p>

        <div className="hide-scrollbar" style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 6,
          scrollbarWidth: "none",
        }}>
          {svc.options.map((opt, i) => {
            const imgOpt = opt as typeof opt & { img?: string };
            return (
              <div key={i} style={{
                minWidth: 155,
                maxWidth: 155,
                flexShrink: 0,
                scrollSnapAlign: "start",
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,.08)",
                cursor: "pointer",
              }}>
                <div style={{ position: "relative" }}>
                  {imgOpt.img && (
                    <img
                      src={imgOpt.img}
                      alt={opt.label}
                      style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                    />
                  )}
                  {opt.badge && (
                    <span style={{
                      position: "absolute",
                      top: 8,
                      [isRTL ? "right" : "left"]: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      backgroundColor: accentBlue,
                      borderRadius: 20,
                      padding: "2px 8px",
                    }}>{opt.badge}</span>
                  )}
                </div>
                <div style={{ padding: "10px 10px 12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textMain, marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: textMuted, marginBottom: 6, lineHeight: 1.4 }}>{opt.desc}</div>
                  {opt.price && (
                    <div style={{ fontSize: 12, fontWeight: 800, color: accentBlueText }}>{opt.price}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "8px 12px", backgroundColor: accentBlueSoft, borderRadius: 10, border: `1px solid ${isDark ? "#1d4ed830" : "#bfdbfe"}` }}>
        <div>
          <p style={titleStyle}>{svc.title}</p>
          <p style={subtitleStyle}>{svc.subtitle}</p>
        </div>
      </div>

      <div>
        {svc.options.map((opt, i) => (
          <div key={i} style={{ ...optionRowStyle, borderBottom: i === svc.options.length - 1 ? "none" : optionRowStyle.borderBottom }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{opt.label}</span>
                {opt.badge && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: accentBlue, borderRadius: 6, padding: "1px 6px" }}>{opt.badge}</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: textMuted }}>{opt.desc}</span>
            </div>
            {opt.price && <span style={{ fontSize: 12, fontWeight: 700, color: accentBlueText, whiteSpace: "nowrap" }}>{opt.price}</span>}
          </div>
        ))}
      </div>

      <a href={svc.link} target="_blank" rel="noopener noreferrer" style={ctaBtn}>
        {svc.cta}
      </a>
    </div>
  );
}

interface AirportPickupProps {
  ap: typeof T.ar.airport_pickup;
  containerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  ctaBtn: React.CSSProperties;
  isDark: boolean;
  textMuted: string;
  cardBorder: string;
  accentBlueSoft: string;
  accentBlueText: string;
  onServiceRequested?: (type: string) => void;
}

function AirportPickupCard({ ap, containerStyle, titleStyle, subtitleStyle, inputStyle, labelStyle, ctaBtn, isDark, textMuted, accentBlueSoft, accentBlueText, onServiceRequested }: AirportPickupProps) {
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!flight || !date || !address) return;
    setLoading(true);
    try {
      await api.post("/services", { type: "airport_pickup", details: { flight, date, address } });
      setSuccess(true);
      onServiceRequested?.("airport_pickup");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ padding: "8px 12px", backgroundColor: accentBlueSoft, borderRadius: 10, border: `1px solid ${isDark ? "#1d4ed830" : "#bfdbfe"}`, marginBottom: 14 }}>
        <p style={titleStyle}>{ap.title}</p>
        <p style={subtitleStyle}>{ap.subtitle}</p>
      </div>
      {success ? (
        <div style={{ textAlign: "center", padding: "16px 0", fontSize: 14, color: "#22c55e", fontWeight: 600 }}>{ap.successMsg}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={labelStyle}>{ap.flightLabel}</label>
            <input style={inputStyle} placeholder={ap.flightPH} value={flight} onChange={e => setFlight(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{ap.dateLabel}</label>
            <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{ap.addressLabel}</label>
            <input style={inputStyle} placeholder={ap.addressPH} value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{ap.from}</p>
          <button onClick={submit} disabled={loading || !flight || !date || !address} style={{ ...ctaBtn, opacity: (!flight || !date || !address) ? 0.6 : 1, cursor: (!flight || !date || !address) ? "not-allowed" : "pointer" }}>
            {loading ? "..." : ap.submitBtn}
          </button>
        </div>
      )}
    </div>
  );
}

interface PrepaidCardFormProps {
  pc: typeof T.ar.prepaid_card;
  containerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  ctaBtn: React.CSSProperties;
  isDark: boolean;
  textMuted: string;
  cardBorder: string;
  accentBlueSoft: string;
  accentBlueText: string;
  font: string;
  onServiceRequested?: (type: string) => void;
}

function PrepaidCardForm({ pc, containerStyle, titleStyle, subtitleStyle, inputStyle, labelStyle, ctaBtn, isDark, textMuted, accentBlueSoft, accentBlueText, font, onServiceRequested }: PrepaidCardFormProps) {
  const [name, setName] = useState("");
  const [passport, setPassport] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(pc.amounts[1]);
  const [iban, setIban] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = name.trim() && passport.trim() && address.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await api.post("/services", {
        type: "prepaid_card",
        details: { fullName: name, passportNumber: passport, address, loadAmount: amount, iban: iban || undefined },
      });
      setSuccess(true);
      onServiceRequested?.("prepaid_card");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ padding: "8px 12px", backgroundColor: accentBlueSoft, borderRadius: 10, border: `1px solid ${isDark ? "#1d4ed830" : "#bfdbfe"}`, marginBottom: 14 }}>
        <p style={titleStyle}>{pc.title}</p>
        <p style={subtitleStyle}>{pc.subtitle}</p>
      </div>
      {success ? (
        <div style={{ textAlign: "center", padding: "16px 0", fontSize: 14, color: "#22c55e", fontWeight: 600 }}>{pc.successMsg}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={labelStyle}>{pc.nameLabel}</label>
            <input style={inputStyle} placeholder={pc.namePH} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{pc.passportLabel}</label>
            <input style={inputStyle} placeholder={pc.passportPH} value={passport} onChange={e => setPassport(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{pc.addressLabel}</label>
            <input style={inputStyle} placeholder={pc.addressPH} value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{pc.amountLabel}</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pc.amounts.map(a => (
                <button key={a} onClick={() => setAmount(a)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${a === amount ? "#2563eb" : (isDark ? "#334155" : "#e2e8f0")}`, backgroundColor: a === amount ? (isDark ? "#1d4ed820" : "#eff6ff") : "transparent", color: a === amount ? accentBlueText : textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>{pc.ibanLabel}</label>
            <input style={inputStyle} placeholder={pc.ibanPH} value={iban} onChange={e => setIban(e.target.value)} />
          </div>
          <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{pc.note}</p>
          <button onClick={submit} disabled={loading || !canSubmit} style={{ ...ctaBtn, opacity: !canSubmit ? 0.6 : 1, cursor: !canSubmit ? "not-allowed" : "pointer" }}>
            {loading ? "..." : pc.submitBtn}
          </button>
        </div>
      )}
    </div>
  );
}
