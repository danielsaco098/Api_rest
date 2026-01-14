import multer from "multer";
import { HttpError } from "../errors/HttpError";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/tiff"
]);

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", "Unsupported image format"));
    }
    cb(null, true);
  }
});
