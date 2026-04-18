import fs from "fs";
import multer from "multer";
import { resolveUploadRoot } from "../utils/paths.js";

const uploadRoot = resolveUploadRoot();
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${uniquePrefix}-${safeName}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error("Unsupported attachment type."));
    return;
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  limits: {
    files: 5,
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter,
});
