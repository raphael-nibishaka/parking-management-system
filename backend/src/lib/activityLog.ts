import type { Request } from "express";
import { prisma } from "./prisma.js";

export async function writeActivityLog(params: {
  req: Request;
  userId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}) {
  const ip =
    (params.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    params.req.socket.remoteAddress ||
    undefined;

  await prisma.activityLog.create({
    data: {
      userId: params.userId ?? undefined,
      action: params.action,
      details: params.details ? JSON.stringify(params.details) : undefined,
      ip,
    },
  });
}
