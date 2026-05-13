import { Router, type IRouter } from "express";
import { db, settingsTable, announcementLogsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_SETTINGS = [
  { key: "site_name", value: "Global College LMS", label: "Site Name", category: "general" },
  { key: "site_phone", value: "+92 300 1234567", label: "Contact Phone", category: "contact" },
  { key: "site_email", value: "info@globalcollege.edu.pk", label: "Contact Email", category: "contact" },
  { key: "site_whatsapp", value: "923001234567", label: "WhatsApp Number", category: "contact" },
  { key: "site_address", value: "123 Education Street, Lahore", label: "Main Address", category: "contact" },
  { key: "easypaisa_account", value: "0300-1234567", label: "EasyPaisa Account", category: "payment" },
  { key: "jazzcash_account", value: "0300-1234567", label: "JazzCash Account", category: "payment" },
  { key: "bank_account", value: "MCB - IBAN: PK12MCB0000001234567890", label: "Bank Account", category: "payment" },
  { key: "certificate_signatory", value: "Director, Global College", label: "Certificate Signatory", category: "certificate" },
  { key: "video_completion_threshold", value: "80", label: "Video Completion Threshold (%)", category: "learning" },
];

router.get("/settings", async (req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable).orderBy(settingsTable.category, settingsTable.key);
  if (rows.length === 0) {
    const inserted = await db.insert(settingsTable).values(DEFAULT_SETTINGS).returning();
    res.json(inserted);
    return;
  }
  res.json(rows);
});

router.put("/settings/:key", async (req, res): Promise<void> => {
  const { key } = req.params;
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

router.put("/settings", async (req, res): Promise<void> => {
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

router.get("/announcements", async (req, res): Promise<void> => {
  const rows = await db.select().from(announcementLogsTable).orderBy(desc(announcementLogsTable.sentAt)).limit(20);
  res.json(rows);
});

router.post("/announcements", async (req, res): Promise<void> => {
  const { sentBy, targetType, targetId, title, message } = req.body;
  if (!sentBy || !title || !message) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(announcementLogsTable).values({ sentBy, targetType: targetType || "ALL", targetId, title, message }).returning();
  
  if (targetType === "ALL" || !targetType) {
    const allUsers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isActive, true));
    if (allUsers.length > 0 && allUsers.length < 1000) {
      await db.insert(notificationsTable).values(
        allUsers.map(u => ({ userId: u.id, type: "announcement", title, message }))
      );
    }
  }
  res.status(201).json(row);
});

export default router;
