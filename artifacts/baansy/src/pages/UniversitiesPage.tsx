import { useState, useEffect, useCallback } from "react";
import { api, API_URL } from "@/lib/api";

type Requirements = { minGpa?: number; english?: string; [key: string]: unknown };

type Specialization = {
  id: number;
  nameEn: string;
  nameAr: string;
  degree: "bachelor" | "master" | "phd" | "diploma";
  durationYears: number;
  tuitionFee: string;
  currency: string;
  status: string;
  requirementsJson: Requirements | null;
};

type University = {
  id: number;
  nameEn: string;
  nameAr: string;
  country: string;
  city: string;
  website: string | null;
  logoUrl: string | null;
  status: string;
  specializations: Specialization[];
};

type Props = {
  lang: "ar" | "en";
  theme: "light" | "dark";
  navigate: (page: string) => void;
};

const DEGREE_LABELS: Record<string, Record<string, string>> = {
  bachelor: { en: "Bachelor", ar: "بكالوريوس" },
  master: { en: "Master", ar: "ماجستير" },
  phd: { en: "PhD", ar: "دكتوراه" },
  diploma: { en: "Diploma", ar: "دبلوم" },
};

const COUNTRY_FLAGS: Record<string, string> = {
  Turkey: "🇹🇷", Malaysia: "🇲🇾", Germany: "🇩🇪", UK: "🇬🇧",
  Canada: "🇨🇦", Australia: "🇦🇺", USA: "🇺🇸", France: "🇫🇷",
  Netherlands: "🇳🇱", Poland: "🇵🇱", Hungary: "🇭🇺",
  "Czech Republic": "🇨🇿", "New Zealand": "🇳🇿",
};

export default function UniversitiesPage({ lang, theme, navigate }: Props) {
  const isAr = lang === "ar";
  const isDark = theme === "dark";

  const [universities, setUniversities] = useState<University[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [degree, setDegree] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [specQ, setSpecQ] = useState("");

  const [selected, setSelected] = useState<University | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const colors = {
    bg: isDark ? "#0d1117" : "#f8faff",
    card: isDark ? "#161b22" : "#ffffff",
    border: isDark ? "#30363d" : "#e2e8f0",
    text: isDark ? "#f0f6fc" : "#1e293b",
    muted: isDark ? "#8b949e" : "#64748b",
    primary: "#1d4ed8",
    primaryLight: isDark ? "#1e3a8a" : "#dbeafe",
    badge: isDark ? "#1e3a8a" : "#eff6ff",
    badgeText: isDark ? "#93c5fd" : "#1d4ed8",
    input: isDark ? "#21262d" : "#f1f5f9",
    inputBorder: isDark ? "#30363d" : "#cbd5e1",
    hover: isDark ? "#1c2128" : "#f8faff",
  };

  const fetchUniversities = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({ page: String(currentPage), limit: "12" });
      if (q) params.set("q", q);
      if (country) params.set("country", country);
      if (degree) params.set("degree", degree);
      if (minFee) params.set("minFee", minFee);
      if (maxFee) params.set("maxFee", maxFee);
      if (specQ) params.set("specQ", specQ);

      const res = await fetch(`${API_URL}/universities?${params}`).then(r => r.json());
      if (reset) {
        setUniversities(res.data || []);
        setPage(1);
      } else {
        setUniversities(prev => [...prev, ...(res.data || [])]);
      }
      setHasMore(res.hasMore || false);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [q, country, degree, minFee, maxFee, specQ, page]);

  useEffect(() => {
    api.get<string[]>("/universities/countries").then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    fetchUniversities(true);
  }, [q, country, degree, minFee, maxFee, specQ]);

  const loadMore = () => {
    setPage(p => p + 1);
  };

  useEffect(() => {
    if (page > 1) fetchUniversities(false);
  }, [page]);

  const openDetail = async (uni: University) => {
    setLoadingDetail(true);
    setSelected(uni);
    try {
      const detail = await fetch(`${API_URL}/universities/${uni.id}`).then(r => r.json());
      setSelected(detail);
    } catch {
      // use cached
    } finally {
      setLoadingDetail(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: colors.input,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 8,
    color: colors.text,
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  const selectedDegreeColors: Record<string, string> = {
    bachelor: "#10b981",
    master: "#6366f1",
    phd: "#f59e0b",
    diploma: "#06b6d4",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: colors.bg, color: colors.text, direction: isAr ? "rtl" : "ltr", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ background: isDark ? "#161b22" : "#1d4ed8", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate("home")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 14px", cursor: "pointer", fontSize: 14 }}
        >
          {isAr ? "→ الرئيسية" : "← Home"}
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
            {isAr ? "استكشف الجامعات" : "Explore Universities"}
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            {isAr ? "ابحث وقارن بين الجامعات والتخصصات" : "Search and compare universities and specializations"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: "16px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {/* Search */}
          <div style={{ flex: "1 1 240px" }}>
            <input
              style={inputStyle}
              placeholder={isAr ? "ابحث عن جامعة أو مدينة..." : "Search university or city..."}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          {/* Country */}
          <div style={{ flex: "1 1 160px" }}>
            <select
              style={inputStyle}
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              <option value="">{isAr ? "كل الدول" : "All Countries"}</option>
              {countries.map(c => (
                <option key={c} value={c}>{COUNTRY_FLAGS[c] || ""} {c}</option>
              ))}
            </select>
          </div>
          {/* Degree */}
          <div style={{ flex: "1 1 160px" }}>
            <select style={inputStyle} value={degree} onChange={e => setDegree(e.target.value)}>
              <option value="">{isAr ? "كل الدرجات" : "All Degrees"}</option>
              {Object.entries(DEGREE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v[lang]}</option>
              ))}
            </select>
          </div>
          {/* Fee range */}
          <div style={{ flex: "1 1 120px" }}>
            <input
              style={inputStyle}
              type="number"
              placeholder={isAr ? "رسوم من $" : "Min fee $"}
              value={minFee}
              onChange={e => setMinFee(e.target.value)}
            />
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <input
              style={inputStyle}
              type="number"
              placeholder={isAr ? "رسوم إلى $" : "Max fee $"}
              value={maxFee}
              onChange={e => setMaxFee(e.target.value)}
            />
          </div>
          {/* Specialization search */}
          <div style={{ flex: "1 1 200px" }}>
            <input
              style={inputStyle}
              placeholder={isAr ? "ابحث بالتخصص (طب، هندسة...)" : "Search by major (Medicine, CS...)"}
              value={specQ}
              onChange={e => setSpecQ(e.target.value)}
            />
          </div>
          {/* Clear */}
          {(q || country || degree || minFee || maxFee || specQ) && (
            <button
              onClick={() => { setQ(""); setCountry(""); setDegree(""); setMinFee(""); setMaxFee(""); setSpecQ(""); }}
              style={{ background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.muted, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}
            >
              {isAr ? "مسح الفلاتر" : "Clear Filters"}
            </button>
          )}
        </div>
      </div>

      {/* Grid + Detail panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* University grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading && universities.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: colors.muted }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : universities.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: colors.muted }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
              <p style={{ fontSize: 16 }}>{isAr ? "لا توجد جامعات تطابق البحث" : "No universities match your search"}</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
                {isAr ? `عرض ${universities.length} جامعة` : `Showing ${universities.length} universities`}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {universities.map(uni => (
                  <div
                    key={uni.id}
                    onClick={() => openDetail(uni)}
                    style={{
                      background: colors.card,
                      border: `1px solid ${selected?.id === uni.id ? colors.primary : colors.border}`,
                      borderRadius: 12,
                      padding: 16,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: selected?.id === uni.id ? `0 0 0 2px ${colors.primary}33` : "none",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = colors.hover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = colors.card; }}
                  >
                    {/* Logo + Name */}
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10, background: colors.primaryLight,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, flexShrink: 0, overflow: "hidden"
                      }}>
                        {uni.logoUrl ? <img src={uni.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏛️"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>
                          {isAr ? uni.nameAr : uni.nameEn}
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.muted }}>
                          {COUNTRY_FLAGS[uni.country] || ""} {uni.city}, {uni.country}
                        </p>
                      </div>
                    </div>

                    {/* Specialization badges */}
                    {uni.specializations.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {uni.specializations.slice(0, 3).map(s => (
                          <span key={s.id} style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: selectedDegreeColors[s.degree] + "22",
                            color: selectedDegreeColors[s.degree],
                            fontWeight: 500,
                          }}>
                            {DEGREE_LABELS[s.degree]?.[lang] || s.degree}
                          </span>
                        ))}
                        {uni.specializations.length > 3 && (
                          <span style={{ fontSize: 11, color: colors.muted }}>
                            +{uni.specializations.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Min fee */}
                    {uni.specializations.length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, color: colors.muted }}>
                        {isAr ? "الرسوم من " : "Fees from "}
                        <span style={{ color: "#10b981", fontWeight: 600 }}>
                          {Math.min(...uni.specializations.map(s => Number(s.tuitionFee) || 0)).toLocaleString()}
                          {" "}{uni.specializations[0]?.currency || "USD"}/yr
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    style={{
                      background: colors.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 32px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (isAr ? "جاري التحميل..." : "Loading...") : (isAr ? "تحميل المزيد" : "Load More")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            width: 380,
            borderInlineStart: `1px solid ${colors.border}`,
            overflowY: "auto",
            background: colors.card,
            padding: 20,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
                  {isAr ? selected.nameAr : selected.nameEn}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.muted }}>
                  {COUNTRY_FLAGS[selected.country] || ""} {selected.city}, {selected.country}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "transparent", border: "none", color: colors.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {selected.website && (
              <a
                href={selected.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  background: colors.primaryLight,
                  color: colors.primary,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                🌐 {isAr ? "زيارة الموقع" : "Visit Website"}
              </a>
            )}

            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: colors.text }}>
                {isAr ? "التخصصات المتاحة" : "Available Specializations"}
              </h3>
              {loadingDetail ? (
                <p style={{ color: colors.muted, fontSize: 13 }}>{isAr ? "جاري التحميل..." : "Loading..."}</p>
              ) : selected.specializations.length === 0 ? (
                <p style={{ color: colors.muted, fontSize: 13 }}>{isAr ? "لا توجد تخصصات حالياً" : "No specializations listed"}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {selected.specializations.map(s => {
                    const isOpen = s.status === "active";
                    const req = s.requirementsJson;
                    return (
                    <div key={s.id} style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      padding: 12,
                      opacity: isOpen ? 1 : 0.65,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.text }}>
                              {isAr ? s.nameAr : s.nameEn}
                            </p>
                            <span style={{
                              fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 700,
                              background: isOpen ? "#d1fae520" : "#fee2e220",
                              color: isOpen ? "#10b981" : "#ef4444",
                              border: `1px solid ${isOpen ? "#10b98140" : "#ef444440"}`,
                            }}>
                              {isOpen ? (isAr ? "✓ مفتوح" : "✓ Open") : (isAr ? "✕ مغلق" : "✕ Closed")}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 20,
                              background: selectedDegreeColors[s.degree] + "22",
                              color: selectedDegreeColors[s.degree],
                            }}>
                              {DEGREE_LABELS[s.degree]?.[lang]}
                            </span>
                            <span style={{ fontSize: 11, color: colors.muted }}>
                              {s.durationYears} {isAr ? "سنوات" : "yrs"}
                            </span>
                          </div>
                          {req && (req.minGpa || req.english) && (
                            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {req.minGpa && (
                                <span style={{ fontSize: 10, background: isDark ? "#1e293b" : "#f8faff", color: colors.muted, border: `1px solid ${colors.border}`, padding: "2px 8px", borderRadius: 20 }}>
                                  📊 {isAr ? "GPA" : "Min GPA"}: {req.minGpa}
                                </span>
                              )}
                              {req.english && (
                                <span style={{ fontSize: 10, background: isDark ? "#1e293b" : "#f8faff", color: colors.muted, border: `1px solid ${colors.border}`, padding: "2px 8px", borderRadius: 20 }}>
                                  🌐 {req.english}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "end", flexShrink: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#10b981" }}>
                            {Number(s.tuitionFee).toLocaleString()}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>{s.currency}/yr</p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
