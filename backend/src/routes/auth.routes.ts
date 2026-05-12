import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { config } from "../lib/config.js";
import { AppError } from "../lib/errors.js";
import { writeActivityLog } from "../lib/activityLog.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import type { Role } from "@prisma/client";

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body as z.infer<typeof registerSchema>;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new AppError(409, "Email is already registered", "EMAIL_IN_USE");
    }
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash,
        role: "PARKING_ATTENDANT",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
    await writeActivityLog({
      req,
      userId: user.id,
      action: "USER_REGISTERED",
      details: { email: user.email },
    });
    res.status(201).json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role as Role },
      config.jwtSecret as Secret,
      { expiresIn: config.jwtExpiresIn } as SignOptions
    );
    await writeActivityLog({
      req,
      userId: user.id,
      action: "USER_LOGIN",
      details: { email: user.email },
    });
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppError(404, "User not found", "NOT_FOUND");
    }
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});
