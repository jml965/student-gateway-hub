import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/middleware";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/jpg", "image/png",
  "application/pdf",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// In-memory store tracking issued upload paths per user.
// Prevents IDOR: a user cannot claim an upload path that was issued to a different user.
// Note: single-server only. For multi-instance deployments, replace with Redis TTL keys.
const ISSUED_PATHS_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // purge expired entries every hour
const issuedUploadPaths = new Map<string, { userId: number; expiresAt: number }>();

// Periodic cleanup to prevent unbounded map growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of issuedUploadPaths) {
    if (now > entry.expiresAt) issuedUploadPaths.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref(); // unref so the timer doesn't keep the process alive

function recordIssuedPath(objectPath: string, userId: number): void {
  issuedUploadPaths.set(objectPath, { userId, expiresAt: Date.now() + ISSUED_PATHS_TTL_MS });
}

function validateIssuedPath(objectPath: string, userId: number): boolean {
  const entry = issuedUploadPaths.get(objectPath);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    issuedUploadPaths.delete(objectPath);
    return false;
  }
  return entry.userId === userId;
}

router.use(requireAuth);

router.post("/request-upload", async (req: AuthRequest, res) => {
  const { name, size, contentType, documentType } = req.body as {
    name?: string;
    size?: number;
    contentType?: string;
    documentType?: string;
  };

  if (!name || !size || !contentType) {
    res.status(400).json({ error: "validation_error", message: "name, size, and contentType are required" });
    return;
  }

  if (!ALLOWED_MIME.has(contentType)) {
    res.status(400).json({ error: "invalid_mime", message: "Only PDF, JPEG and PNG files are allowed" });
    return;
  }

  if (size > MAX_FILE_SIZE) {
    res.status(400).json({ error: "file_too_large", message: "Maximum file size is 20 MB" });
    return;
  }

  const validTypes = ["passport", "degree", "transcript", "language_cert", "photo", "bank_statement", "other"] as const;
  const docType = validTypes.includes(documentType as typeof validTypes[number])
    ? (documentType as typeof validTypes[number])
    : "other";

  const uploadURL = await storage.getObjectEntityUploadURL();
  const objectPath = storage.normalizeObjectEntityPath(uploadURL);

  recordIssuedPath(objectPath, req.user!.id);

  res.json({ uploadURL, objectPath, documentType: docType });
});

router.post("/", async (req: AuthRequest, res) => {
  const { objectPath, fileName, fileSizeBytes, mimeType, documentType } = req.body as {
    objectPath?: string;
    fileName?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    documentType?: string;
  };

  if (!objectPath || !fileName) {
    res.status(400).json({ error: "validation_error", message: "objectPath and fileName are required" });
    return;
  }

  const userId = req.user!.id;

  // Verify the objectPath was issued to this user via /request-upload
  if (!validateIssuedPath(objectPath, userId)) {
    res.status(403).json({ error: "forbidden", message: "Upload path was not issued to this user or has expired" });
    return;
  }

  // Consume the token so it cannot be reused
  issuedUploadPaths.delete(objectPath);

  const validTypes = ["passport", "degree", "transcript", "language_cert", "photo", "bank_statement", "other"] as const;
  const docType = validTypes.includes(documentType as typeof validTypes[number])
    ? (documentType as typeof validTypes[number])
    : "other";

  const [doc] = await db.insert(documentsTable).values({
    userId,
    type: docType,
    fileName: fileName,
    fileUrl: objectPath,
    fileSizeBytes: fileSizeBytes ?? null,
    mimeType: mimeType ?? null,
    applicationId: null,
    verified: false,
  }).returning();

  // Set ACL policy so the owner can access their file via /storage/objects/*
  try {
    await storage.trySetObjectEntityAclPolicy(objectPath, {
      owner: String(userId),
      visibility: "private",
    });
  } catch {
    // ACL set may fail if object not yet committed (presigned PUT not finished).
    // Non-fatal for metadata save; storage access still enforced at read time.
  }

  res.status(201).json(doc);
});

router.get("/", async (req: AuthRequest, res) => {
  const docs = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, req.user!.id))
    .orderBy(desc(documentsTable.uploadedAt));
  res.json(docs);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, req.user!.id)))
    .limit(1);

  if (!doc) { res.status(404).json({ error: "not_found" }); return; }

  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.json({ success: true });
});

export default router;
