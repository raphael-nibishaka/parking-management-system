import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validateQuery } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { parsePagination, paginationMeta } from "../lib/helpers.js";

const rangeSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .transform((q) => {
    const from = new Date(q.from);
    const to = new Date(q.to);
    return { ...q, from, to };
  })
  .superRefine((q, ctx) => {
    if (Number.isNaN(q.from.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid from date", path: ["from"] });
    }
    if (Number.isNaN(q.to.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid to date", path: ["to"] });
    }
    if (!Number.isNaN(q.from.getTime()) && !Number.isNaN(q.to.getTime()) && q.from > q.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "from must be before or equal to to",
        path: ["to"],
      });
    }
  });

export const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get(
  "/outgoing",
  validateQuery(rangeSchema),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as z.infer<typeof rangeSchema>;
      const { from, to } = q;
      const { page, limit, skip } = parsePagination({
        page: q.page?.toString(),
        limit: q.limit?.toString(),
      });

      const where = {
        exitAt: { not: null, gte: from, lte: to },
      };

      const [total, rows, agg] = await prisma.$transaction([
        prisma.parkingSession.count({ where }),
        prisma.parkingSession.findMany({
          where,
          include: { parking: true },
          orderBy: { exitAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.parkingSession.aggregate({
          where,
          _sum: { chargedAmount: true },
        }),
      ]);

      res.json({
        success: true,
        data: rows,
        meta: {
          ...paginationMeta(total, page, limit),
          totalChargedAmount: agg._sum.chargedAmount ?? 0,
          from,
          to,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

reportRouter.get(
  "/entries",
  validateQuery(rangeSchema),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as z.infer<typeof rangeSchema>;
      const { from, to } = q;
      const { page, limit, skip } = parsePagination({
        page: q.page?.toString(),
        limit: q.limit?.toString(),
      });

      const where = {
        entryAt: { gte: from, lte: to },
      };

      const [total, rows] = await prisma.$transaction([
        prisma.parkingSession.count({ where }),
        prisma.parkingSession.findMany({
          where,
          include: { parking: true },
          orderBy: { entryAt: "desc" },
          skip,
          take: limit,
        }),
      ]);

      res.json({
        success: true,
        data: rows,
        meta: {
          ...paginationMeta(total, page, limit),
          from,
          to,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);
