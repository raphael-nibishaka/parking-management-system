import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../lib/config.js";
import { AppError } from "../lib/errors.js";
import type { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid Authorization header", "UNAUTHORIZED"));
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token", "UNAUTHORIZED"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError(401, "Unauthorized", "UNAUTHORIZED"));
  }
  if (req.user.role !== "ADMIN") {
    return next(new AppError(403, "Admin role required", "FORBIDDEN"));
  }
  next();
}
