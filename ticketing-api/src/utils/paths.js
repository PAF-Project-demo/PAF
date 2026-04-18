import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function resolveUploadRoot() {
  return path.resolve(__dirname, env.uploadDir);
}
