import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth";

const router: IRouter = Router();

// Ensure upload directories exist
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const IMAGES_DIR = path.join(UPLOADS_DIR, "images");
const PDFS_DIR = path.join(UPLOADS_DIR, "pdfs");
[UPLOADS_DIR, IMAGES_DIR, PDFS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Image Upload (thumbnails, profile images, story photos) ──────────────────
// Max 2 MB, JPEG/PNG/WebP only
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed (max 2 MB)"));
    }
  },
});

// ── PDF Upload (course outlines, assignment handouts) ────────────────────────
// Max 5 MB, PDF only
const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PDFS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase();
    cb(null, `${unique}-${safeName}`);
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed (max 5 MB)"));
    }
  },
});

// ── POST /api/upload/image ───────────────────────────────────────────────────
router.post("/upload/image", (req, res) => {
  imageUpload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Image too large. Maximum size is 2 MB." });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const url = `/uploads/images/${req.file.filename}`;
    return res.status(201).json({ url, filename: req.file.filename, size: req.file.size });
  });
});

// ── POST /api/upload/pdf ─────────────────────────────────────────────────────
router.post("/upload/pdf", (req, res) => {
  pdfUpload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "PDF too large. Maximum size is 5 MB." });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided" });
    }
    const url = `/uploads/pdfs/${req.file.filename}`;
    return res.status(201).json({ url, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
  });
});

export default router;
