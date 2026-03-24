import { useState, useEffect, useRef } from "react";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type DocumentRecord = {
  id: number;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  mimeType: string | null;
  verified: boolean;
  uploadedAt: string;
};

type Props = {
  lang: "ar" | "en";
  theme: "light" | "dark";
  navigate: (page: string) => void;
};

const DOC_TYPES = [
  { value: "passport", en: "Passport", ar: "جواز سفر" },
  { value: "degree", en: "Degree Certificate", ar: "شهادة الدراسة" },
  { value: "transcript", en: "Transcript", ar: "كشف الدرجات" },
  { value: "language_cert", en: "Language Certificate", ar: "شهادة اللغة" },
  { value: "photo", en: "Personal Photo", ar: "صورة شخصية" },
  { value: "bank_statement", en: "Bank Statement", ar: "كشف حساب بنكي" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const MAX_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function getDocTypeLabel(type: string, lang: "ar" | "en") {
  const found = DOC_TYPES.find(d => d.value === type);
  return found ? found[lang] : type;
}

export default function DocumentsPage({ lang, theme, navigate }: Props) {
  const { user } = useAuth();
  const isAr = lang === "ar";
  const isDark = theme === "dark";
  const fileRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [docType, setDocType] = useState("other");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const colors = {
    bg: isDark ? "#0d1117" : "#f8faff",
    card: isDark ? "#161b22" : "#ffffff",
    border: isDark ? "#30363d" : "#e2e8f0",
    text: isDark ? "#f0f6fc" : "#1e293b",
    muted: isDark ? "#8b949e" : "#64748b",
    primary: "#1d4ed8",
    primaryLight: isDark ? "#1e3a8a" : "#dbeafe",
    input: isDark ? "#21262d" : "#f1f5f9",
    inputBorder: isDark ? "#30363d" : "#cbd5e1",
    danger: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b",
  };

  const inputStyle: React.CSSProperties = {
    background: colors.input,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 8,
    color: colors.text,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const result = await api.get<DocumentRecord[]>("/documents");
      setDocs(result);
    } catch {
      setError(isAr ? "فشل في تحميل الوثائق" : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDocs();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError(isAr ? "يُسمح فقط بملفات PDF أو JPEG أو PNG" : "Only PDF, JPEG, or PNG files are allowed");
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(isAr ? "الحجم الأقصى للملف 20 ميجابايت" : "Maximum file size is 20 MB");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError("");
    setSuccess("");
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Request presigned upload URL
      const { uploadURL, objectPath } = await api.post<{ uploadURL: string; objectPath: string }>("/documents/request-upload", {
        name: selectedFile.name,
        size: selectedFile.size,
        contentType: selectedFile.type,
        documentType: docType,
      });

      setUploadProgress(20);

      // Step 2: Upload file directly to GCS via presigned URL
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(20 + Math.round((e.loaded / e.total) * 60));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.send(selectedFile);
      });

      setUploadProgress(80);

      // Step 3: Save document metadata
      await api.post<DocumentRecord>("/documents", {
        objectPath,
        fileName: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        mimeType: selectedFile.type,
        documentType: docType,
      });

      setUploadProgress(100);
      setSuccess(isAr ? "تم رفع الوثيقة بنجاح!" : "Document uploaded successfully!");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await fetchDocs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(isAr ? `فشل الرفع: ${msg}` : `Upload failed: ${msg}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDelete = async (doc: DocumentRecord) => {
    if (!confirm(isAr ? `هل تريد حذف "${doc.fileName}"؟` : `Delete "${doc.fileName}"?`)) return;
    setDeleting(doc.id);
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch {
      setError(isAr ? "فشل في الحذف" : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const getMimeIcon = (mime: string | null) => {
    if (!mime) return "📎";
    if (mime === "application/pdf") return "📄";
    if (mime.startsWith("image/")) return "🖼️";
    return "📎";
  };

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: colors.bg, color: colors.text, direction: isAr ? "rtl" : "ltr" }}>
        <p style={{ fontSize: 16, marginBottom: 16 }}>{isAr ? "يجب تسجيل الدخول أولاً" : "Please log in first"}</p>
        <button onClick={() => navigate("login")} style={{ background: colors.primary, color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          {isAr ? "تسجيل الدخول" : "Log In"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: colors.bg, color: colors.text, direction: isAr ? "rtl" : "ltr", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ background: isDark ? "#161b22" : "#1d4ed8", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("home")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>
          {isAr ? "→ الرئيسية" : "← Home"}
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
            {isAr ? "وثائقي" : "My Documents"}
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            {isAr ? "رفع وإدارة وثائق التسجيل" : "Upload and manage your registration documents"}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", padding: "24px 20px" }}>
        {/* Upload card */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: colors.text }}>
            📤 {isAr ? "رفع وثيقة جديدة" : "Upload New Document"}
          </h2>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: "#dc2626", fontSize: 14 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: "#16a34a", fontSize: 14 }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {/* Document type */}
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.muted, marginBottom: 6 }}>
                {isAr ? "نوع الوثيقة" : "Document Type"}
              </label>
              <select style={inputStyle} value={docType} onChange={e => setDocType(e.target.value)}>
                {DOC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t[lang]}</option>
                ))}
              </select>
            </div>

            {/* File picker */}
            <div style={{ flex: "2 1 300px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.muted, marginBottom: 6 }}>
                {isAr ? "اختر الملف (PDF / JPEG / PNG — حتى 20 ميجابايت)" : "Choose File (PDF / JPEG / PNG — up to 20 MB)"}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ ...inputStyle, padding: "7px 14px" }}
              />
            </div>
          </div>

          {/* Selected file info */}
          {selectedFile && (
            <div style={{ marginTop: 12, background: colors.primaryLight, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.text }}>{selectedFile.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.muted }}>{formatBytes(selectedFile.size)}</p>
              </div>
              <button
                onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ background: "transparent", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}
              >✕</button>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 6, background: colors.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${uploadProgress}%`, background: colors.primary, borderRadius: 99, transition: "width 0.3s" }} />
              </div>
              <p style={{ fontSize: 12, color: colors.muted, marginTop: 4, textAlign: "center" }}>
                {uploadProgress}% {isAr ? "تم الرفع" : "uploaded"}
              </p>
            </div>
          )}

          {/* Upload button */}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              style={{
                background: (!selectedFile || uploading) ? colors.inputBorder : colors.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                fontSize: 15,
                fontWeight: 600,
                cursor: (!selectedFile || uploading) ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع الوثيقة" : "Upload Document")}
            </button>
          </div>
        </div>

        {/* Documents list */}
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: colors.text }}>
            📁 {isAr ? "وثائقي المرفوعة" : "My Uploaded Documents"} {!loading && `(${docs.length})`}
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: colors.muted }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: colors.muted, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <p style={{ fontSize: 16 }}>{isAr ? "لم تقم برفع أي وثائق بعد" : "No documents uploaded yet"}</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>{isAr ? "استخدم النموذج أعلاه لرفع وثائقك" : "Use the form above to upload your documents"}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {docs.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  {/* Icon */}
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{getMimeIcon(doc.mimeType)}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.fileName}
                      </p>
                      {/* Verified badge */}
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20,
                        background: doc.verified ? "#d1fae5" : "#fef9c3",
                        color: doc.verified ? "#065f46" : "#854d0e",
                        fontWeight: 600, flexShrink: 0,
                      }}>
                        {doc.verified
                          ? (isAr ? "✓ موثقة" : "✓ Verified")
                          : (isAr ? "⏳ بانتظار التوثيق" : "⏳ Pending Verification")}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: colors.muted }}>
                        🗂️ {getDocTypeLabel(doc.type, lang)}
                      </span>
                      {doc.fileSizeBytes && (
                        <span style={{ fontSize: 12, color: colors.muted }}>
                          💾 {formatBytes(doc.fileSizeBytes)}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: colors.muted }}>
                        📅 {formatDate(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    style={{
                      background: "transparent",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      color: colors.danger,
                      padding: "6px 12px",
                      cursor: deleting === doc.id ? "not-allowed" : "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      flexShrink: 0,
                      opacity: deleting === doc.id ? 0.5 : 1,
                    }}
                  >
                    {deleting === doc.id ? "..." : (isAr ? "حذف" : "Delete")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
