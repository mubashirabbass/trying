import { Router, type IRouter } from "express";
import { db, settingsTable, announcementLogsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

const DEFAULT_SETTINGS = [
  { key: "site_name", value: "Global College LMS", label: "Site Name", category: "general" },
  { key: "site_phone", value: "+92 300 1234567", label: "Contact Phone", category: "contact" },
  { key: "site_email", value: "info@globalcollege.edu.pk", label: "Contact Email", category: "contact" },
  { key: "site_whatsapp", value: "923001234567", label: "WhatsApp Number", category: "contact" },
  { key: "site_address", value: "123 Education Street, Lahore", label: "Main Address", category: "contact" },
  { key: "site_facebook", value: "https://facebook.com/globalcollege", label: "Facebook Page URL", category: "social" },
  { key: "site_instagram", value: "https://instagram.com/globalcollege", label: "Instagram Profile URL", category: "social" },
  { key: "site_youtube", value: "https://youtube.com/globalcollege", label: "YouTube Channel URL", category: "social" },
  { key: "tawk_property_id", value: "6a0d64b5eb79041c2f204f14", label: "Tawk.to Property ID (Live Chat)", category: "social" },
  { key: "tawk_widget_id", value: "1jp252pdn", label: "Tawk.to Widget ID (Live Chat)", category: "social" },
  { key: "hero_title", value: "Learn from the Best Industry Experts", label: "Hero Title", category: "homepage" },
  { key: "hero_subtitle", value: "Start your journey today with our world-class courses designed to help you excel in the digital age.", label: "Hero Subtitle", category: "homepage" },
  { key: "hero_cta_text", value: "Browse Courses", label: "Hero CTA Text", category: "homepage" },
  { key: "about_section_title", value: "Empowering Next Generation of Professionals", label: "About Section Title", category: "homepage" },
  { key: "about_section_content", value: "Global College is dedicated to providing high-quality technical and professional education to students across Pakistan.", label: "About Section Content", category: "homepage" },
  { key: "easypaisa_account", value: "0300-1234567", label: "EasyPaisa Account", category: "payment" },
  { key: "jazzcash_account", value: "0300-1234567", label: "JazzCash Account", category: "payment" },
  { key: "bank_account", value: "MCB - IBAN: PK12MCB0000001234567890", label: "Bank Account", category: "payment" },
  { key: "certificate_signatory", value: "Director, Global College", label: "Certificate Signatory", category: "certificate" },
  { key: "video_completion_threshold", value: "80", label: "Video Completion Threshold (%)", category: "learning" },
  { key: "student_notice_enabled", value: "true", label: "Enable Student Notice Banner", category: "student_portal" },
  { key: "student_notice_text", value: "Important Note: Attendance criteria for Spring, 2026 is 75%.", label: "Student Notice Text", category: "student_portal" },
];

router.get("/settings", async (req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable).orderBy(settingsTable.category, settingsTable.key);
  // Always upsert any missing default keys (handles new fields added after initial seed)
  const existingKeys = new Set(rows.map((r: any) => r.key));
  const missing = DEFAULT_SETTINGS.filter(d => !existingKeys.has(d.key));
  if (missing.length > 0) {
    await db.insert(settingsTable).values(missing);
    const updated = await db.select().from(settingsTable).orderBy(settingsTable.category, settingsTable.key);
    res.json(updated);
    return;
  }
  if (rows.length === 0) {
    const inserted = await db.insert(settingsTable).values(DEFAULT_SETTINGS).returning();
    res.json(inserted);
    return;
  }
  res.json(rows);
});

router.put("/settings/:key", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const rawKey = req.params.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  const { value } = req.body;
  if (!value && value !== "") { res.status(400).json({ error: "Value required" }); return; }
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (existing.length === 0) {
    const [row] = await db.insert(settingsTable).values({ key, value }).returning();
    res.json(row);
  } else {
    const [row] = await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key)).returning();
    res.json(row);
  }
});

router.put("/settings", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const updates: Record<string, string> = req.body;
  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    if (existing.length === 0) {
      const [row] = await db.insert(settingsTable).values({ key, value: String(value) }).returning();
      results.push(row);
    } else {
      const [row] = await db.update(settingsTable).set({ value: String(value) }).where(eq(settingsTable.key, key)).returning();
      results.push(row);
    }
  }
  res.json(results);
});

router.get("/announcements", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const rows = await db.select().from(announcementLogsTable).orderBy(desc(announcementLogsTable.sentAt)).limit(20);
  res.json(rows);
});

router.post("/announcements", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const { sentBy, targetType, targetId, title, message } = req.body;
  if (!sentBy || !title || !message) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(announcementLogsTable).values({ sentBy, targetType: targetType || "ALL", targetId, title, message }).returning();
  
  // Trigger notifications
  let targetUsers: Array<{ id: number }> = [];
  if (targetType === "ALL" || !targetType) {
    targetUsers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isActive, true));
  } else if (targetType === "STUDENTS") {
    targetUsers = await db.select({ id: usersTable.id }).from(usersTable).where(and(eq(usersTable.role, "student"), eq(usersTable.isActive, true)));
  } else if (targetType === "TEACHERS") {
    targetUsers = await db.select({ id: usersTable.id }).from(usersTable).where(and(eq(usersTable.role, "teacher"), eq(usersTable.isActive, true)));
  }

  if (targetUsers.length > 0 && targetUsers.length < 5000) {
    // Insert in chunks if needed, but 5000 is safe for a single insert in many DBs
    await db.insert(notificationsTable).values(
      targetUsers.map(u => ({ userId: u.id, type: "announcement", title, message }))
    );
  }
  res.status(201).json(row);
});

export default router;
