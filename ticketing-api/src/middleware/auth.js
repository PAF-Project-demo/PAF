import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw createHttpError(401, "Authentication required.");
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      throw createHttpError(401, "Your session is no longer valid.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw createHttpError(401, "Invalid or expired token.");
  }
});

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(createHttpError(401, "Authentication required."));
    }

    if (!roles.includes(req.user.role)) {
      return next(createHttpError(403, "You do not have access to this action."));
    }

    next();
  };
}
