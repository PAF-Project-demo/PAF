import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

const serializeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  department: user.department ?? null,
  skills: user.skills ?? [],
});

const issueToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role = "USER", department, skills = [] } =
    req.body;

  if (!fullName || !email || !password) {
    throw createHttpError(400, "fullName, email, and password are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();

  if (existingUser) {
    throw createHttpError(409, "A user with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    department,
    skills,
  });

  res.status(201).json({
    token: issueToken(user),
    user: serializeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createHttpError(400, "email and password are required.");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    throw createHttpError(401, "Invalid credentials.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw createHttpError(401, "Invalid credentials.");
  }

  res.json({
    token: issueToken(user),
    user: serializeUser(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

export const listTechnicians = asyncHandler(async (_req, res) => {
  const technicians = await User.find({
    role: { $in: ["TECHNICIAN", "ADMIN"] },
    isActive: true,
  })
    .sort({ fullName: 1 })
    .lean();

  res.json(
    technicians.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      skills: user.skills ?? [],
    }))
  );
});
