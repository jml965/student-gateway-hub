import { useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import HomePage from "@/pages/HomePage";
import { LoginPage, SignupPage, ForgotPage, ResetPasswordPage } from "@/pages/AuthPages";
import ReferralPage from "@/pages/ReferralPage";
import AdminPage from "@/pages/AdminPage";
import UniversityRegisterPage from "@/pages/UniversityRegisterPage";
import UniversityPortalPage from "@/pages/UniversityPortalPage";
import UniversitiesPage from "@/pages/UniversitiesPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import PaymentPage from "@/pages/PaymentPage";

type Page = "home" | "login" | "signup" | "forgot" | "reset-password" | "referral" | "admin" | "university-register" | "university-portal" | "universities" | "documents" | "applications" | "payment";
type Lang = "ar" | "en";
type Theme = "light" | "dark";

function detectInitialPage(): Page {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (path.includes("reset-password") || params.has("token")) return "reset-password";
  return "home";
}

export default function App() {
  const [page, setPage] = useState<Page>(detectInitialPage);
  const [lang, setLang] = useState<Lang>("ar");
  const [theme, setTheme] = useState<Theme>("dark");
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
        {page === "reset-password" && <ResetPasswordPage {...commonProps} />}
        {page === "referral" && <ReferralPage {...commonProps} />}
        {page === "admin" && <AdminPage {...commonProps} />}
        {page === "university-register" && <UniversityRegisterPage {...commonProps} />}
        {page === "university-portal" && <UniversityPortalPage {...commonProps} />}
        {page === "universities" && <UniversitiesPage {...commonProps} />}
        {page === "documents" && <DocumentsPage {...commonProps} />}
        {page === "applications" && <ApplicationsPage {...commonProps} />}
        {page === "payment" && <PaymentPage {...commonProps} />}
      </div>
    </AuthProvider>
  );
}
