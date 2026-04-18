import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  mongoUri:
    process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/paf_ticketing",
  jwtSecret: process.env.JWT_SECRET ?? "ticketing-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  uploadDir: process.env.UPLOAD_DIR ?? "../../uploads/ticketing",
};
