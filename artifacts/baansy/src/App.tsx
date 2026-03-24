import { useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import HomePage from "@/pages/HomePage";
import { LoginPage, SignupPage, ForgotPage } from "@/pages/AuthPages";
import ReferralPage from "@/pages/ReferralPage";
import AdminPage from "@/pages/AdminPage";

type Page = "home" | "login" | "signup" | "forgot" | "referral" | "admin";
type Lang = "ar" | "en";
type Theme = "light" | "dark";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [lang, setLang] = useState<Lang>("ar");
  const [theme, setTheme] = useState<Theme>("light");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.style.fontFamily = lang === "ar" ? "'Cairo','Inter',sans-serif" : "'Inter','Cairo',sans-serif";
    document.body.style.backgroundColor = theme === "dark" ? "#0d1117" : "#f8faff";
  }, [lang, theme]);

  const navigate = (p: string) => setPage(p as Page);

  const commonProps = { lang, theme, navigate };

  return (
    <AuthProvider>
      <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
        {page === "home" && (
          <HomePage {...commonProps} setLang={setLang} setTheme={setTheme} isMobile={isMobile} />
        )}
        {page === "login" && <LoginPage {...commonProps} />}
        {page === "signup" && <SignupPage {...commonProps} />}
        {page === "forgot" && <ForgotPage {...commonProps} />}
        {page === "referral" && <ReferralPage {...commonProps} />}
        {page === "admin" && <AdminPage {...commonProps} />}
      </div>
    </AuthProvider>
  );
}
