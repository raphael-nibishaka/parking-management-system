import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { parsePagination, paginationMeta } from "../lib/helpers.js";

export const logRouter = Router();

logRouter.use(requireAuth, requireAdmin);

logRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
    const [total, rows] = await prisma.$transaction([
      prisma.activityLog.count(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      action: r.action,
      details: r.details ? safeJson(r.details) : null,
      ip: r.ip,
      createdAt: r.createdAt,
      user: r.user,
    }));

    res.json({
      success: true,
      data,
      meta: paginationMeta(total, page, limit),
    });
  } catch (e) {
    next(e);
  }
});

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
