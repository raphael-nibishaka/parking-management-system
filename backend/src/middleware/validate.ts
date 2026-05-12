import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "../lib/errors.js";

function validate(schema: ZodTypeAny, source: "body" | "query") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const raw = source === "body" ? req.body : req.query;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return next(
        new AppError(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten())
      );
    }
    if (source === "body") {
      req.body = parsed.data;
    } else {
      req.query = parsed.data as typeof req.query;
    }
    next();
  };
}

export function validateBody(schema: ZodTypeAny) {
  return validate(schema, "body");
}

export function validateQuery(schema: ZodTypeAny) {
  return validate(schema, "query");
}
