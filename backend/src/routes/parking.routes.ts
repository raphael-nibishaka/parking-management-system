import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { writeActivityLog } from "../lib/activityLog.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { parsePagination, paginationMeta } from "../lib/helpers.js";

const createSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  totalSpaces: z.number().int().min(1),
  location: z.string().min(1).max(500),
  feePerHour: z.number().min(0),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  totalSpaces: z.number().int().min(1).optional(),
  location: z.string().min(1).max(500).optional(),
  feePerHour: z.number().min(0).optional(),
});

export const parkingRouter = Router();

parkingRouter.use(requireAuth);

parkingRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
    const [total, rows] = await prisma.$transaction([
      prisma.parking.count(),
      prisma.parking.findMany({
        orderBy: { code: "asc" },
        skip,
        take: limit,
      }),
    ]);
    res.json({
      success: true,
      data: rows,
      meta: paginationMeta(total, page, limit),
    });
  } catch (e) {
    next(e);
  }
});

parkingRouter.get("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const row = await prisma.parking.findUnique({ where: { id } });
    if (!row) throw new AppError(404, "Parking not found", "NOT_FOUND");
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
});

parkingRouter.post("/", requireAdmin, validateBody(createSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    const code = body.code.trim().toUpperCase();
    const created = await prisma.parking.create({
      data: {
        code,
        name: body.name.trim(),
        totalSpaces: body.totalSpaces,
        availableSpaces: body.totalSpaces,
        location: body.location.trim(),
        feePerHour: body.feePerHour,
      },
    });
    await writeActivityLog({
      req,
      userId: req.user!.id,
      action: "PARKING_CREATED",
      details: { parkingId: created.id, code: created.code },
    });
    res.status(201).json({ success: true, data: created });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return next(new AppError(409, "Parking code already exists", "DUPLICATE_CODE"));
    }
    next(e);
  }
});

parkingRouter.put("/:id", requireAdmin, validateBody(updateSchema), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const body = req.body as z.infer<typeof updateSchema>;
    const existing = await prisma.parking.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Parking not found", "NOT_FOUND");

    let totalSpaces = existing.totalSpaces;
    if (body.totalSpaces != null) {
      totalSpaces = body.totalSpaces;
    }
    const occupied = existing.totalSpaces - existing.availableSpaces;
    let availableSpaces = existing.availableSpaces;
    if (body.totalSpaces != null) {
      availableSpaces = Math.max(0, totalSpaces - occupied);
      if (availableSpaces > totalSpaces) availableSpaces = totalSpaces;
    }

    const updated = await prisma.parking.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        totalSpaces,
        availableSpaces,
        location: body.location?.trim() ?? existing.location,
        feePerHour: body.feePerHour ?? existing.feePerHour,
      },
    });
    await writeActivityLog({
      req,
      userId: req.user!.id,
      action: "PARKING_UPDATED",
      details: { parkingId: updated.id },
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

parkingRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.parking.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "Parking not found", "NOT_FOUND");
    await prisma.parking.delete({ where: { id } });
    await writeActivityLog({
      req,
      userId: req.user!.id,
      action: "PARKING_DELETED",
      details: { parkingId: existing.id, code: existing.code },
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
