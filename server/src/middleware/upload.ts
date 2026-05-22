import multer from "multer";
import { AppError } from "../lib/auth";

/**
 * Configure Multer to store files in memory as buffers
 * This allows us to upload directly to Cloudinary without local disk storage
 */
const storage = multer.memoryStorage();
export const ASSIGNMENT_PDF_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Filter files based on MIME type
 */
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    "image/jpeg", 
    "image/png", 
    "image/webp", 
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only JPEG, PNG, WEBP, PDF, and DOCX are allowed.", 400), false);
  }
};

/**
 * Upload middleware with 10MB limit
 */
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

export const assignmentPdfUpload = multer({
  storage,
  limits: {
    fileSize: ASSIGNMENT_PDF_MAX_BYTES,
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new AppError("Only PDF files are allowed.", 400), false);
    }
  },
});

export const MESSAGE_MEDIA_MAX_BYTES = 8 * 1024 * 1024;

export const messageMediaUpload = multer({
  storage,
  limits: {
    fileSize: MESSAGE_MEDIA_MAX_BYTES,
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const mimeType = String(file.mimetype || "").toLowerCase().split(";", 1)[0];
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(mimeType);
    const isAudio = mimeType.startsWith("audio/");
    const isRecordedAudioContainer = ["video/webm", "video/mp4", "application/octet-stream"].includes(mimeType);

    if (isImage || isAudio || isRecordedAudioContainer) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files and voice notes are allowed.", 400), false);
    }
  },
});
