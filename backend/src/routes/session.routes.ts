import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { writeActivityLog } from "../lib/activityLog.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import {
  computeParkingCharge,
  generateTicketNumber,
  parsePagination,
  paginationMeta,
} from "../lib/helpers.js";

const entrySchema = z.object({
  plateNumber: z.string().min(2).max(32).transform((s) => s.trim().toUpperCase()),
  parkingCode: z.string().min(1).max(50).transform((s) => s.trim().toUpperCase()),
  entryAt: z.coerce.date().optional(),
});

const exitSchema = z.object({
  exitAt: z.coerce.date().optional(),
});

export const sessionRouter = Router();

sessionRouter.use(requireAuth);

sessionRouter.get("/active", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
    const where = { exitAt: null as null };
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
      meta: paginationMeta(total, page, limit),
    });
  } catch (e) {
    next(e);
  }
});

sessionRouter.post("/entry", validateBody(entrySchema), async (req, res, next) => {
  try {
    const { plateNumber, parkingCode, entryAt } = req.body as z.infer<typeof entrySchema>;
    const parking = await prisma.parking.findUnique({ where: { code: parkingCode } });
    if (!parking) {
      throw new AppError(404, "Parking code not found", "PARKING_NOT_FOUND");
    }
    if (parking.availableSpaces <= 0) {
      throw new AppError(409, "No available spaces at this parking", "NO_SPACE");
    }

    const entryTime = entryAt ?? new Date();
    const ticketNumber = generateTicketNumber();

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.parkingSession.create({
        data: {
          ticketNumber,
          plateNumber,
          parkingId: parking.id,
          entryAt: entryTime,
          exitAt: null,
          chargedAmount: 0,
        },
        include: { parking: true },
      });
      await tx.parking.update({
        where: { id: parking.id },
        data: { availableSpaces: { decrement: 1 } },
      });
      return session;
    });

    await writeActivityLog({
      req,
      userId: req.user!.id,
      action: "CAR_ENTRY",
      details: {
        sessionId: result.id,
        ticketNumber: result.ticketNumber,
        plateNumber,
        parkingCode,
      },
    });

    const ticket = {
      ticketNumber: result.ticketNumber,
      sessionId: result.id,
      plateNumber: result.plateNumber,
      parking: {
        code: result.parking.code,
        name: result.parking.name,
        location: result.parking.location,
      },
      entryAt: result.entryAt,
      message: "Vehicle recorded. Please keep this ticket for exit.",
    };

    res.status(201).json({
      success: true,
      data: {
        session: result,
        ticket,
      },
    });
  } catch (e) {
    next(e);
  }
});

sessionRouter.post("/:id/exit", validateBody(exitSchema), async (req, res, next) => {
  try {
    const { exitAt } = req.body as z.infer<typeof exitSchema>;
    const exitTime = exitAt ?? new Date();

    const sessionId = String(req.params.id);
    const session = await prisma.parkingSession.findUnique({
      where: { id: sessionId },
      include: { parking: true },
    });
    if (!session) {
      throw new AppError(404, "Session not found", "NOT_FOUND");
    }
    if (session.exitAt) {
      throw new AppError(400, "Vehicle already checked out", "ALREADY_EXITED");
    }
    if (exitTime < session.entryAt) {
      throw new AppError(400, "Exit time cannot be before entry time", "INVALID_EXIT");
    }

    const chargedAmount = computeParkingCharge(session.entryAt, exitTime, session.parking.feePerHour);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.parkingSession.update({
        where: { id: session.id },
        data: {
          exitAt: exitTime,
          chargedAmount,
        },
        include: { parking: true },
      });
      await tx.parking.update({
        where: { id: session.parkingId },
        data: {
          availableSpaces: {
            increment: 1,
          },
        },
      });
      const p = await tx.parking.findUnique({ where: { id: session.parkingId } });
      if (p && p.availableSpaces > p.totalSpaces) {
        await tx.parking.update({
          where: { id: p.id },
          data: { availableSpaces: p.totalSpaces },
        });
      }
      return u;
    });

    const ms = exitTime.getTime() - session.entryAt.getTime();
    const hoursBilled = Math.ceil(ms / (1000 * 60 * 60));

    await writeActivityLog({
      req,
      userId: req.user!.id,
      action: "CAR_EXIT",
      details: {
        sessionId: updated.id,
        ticketNumber: updated.ticketNumber,
        chargedAmount,
      },
    });

    const bill = {
      ticketNumber: updated.ticketNumber,
      sessionId: updated.id,
      plateNumber: updated.plateNumber,
      parking: {
        code: updated.parking.code,
        name: updated.parking.name,
        location: updated.parking.location,
        feePerHour: updated.parking.feePerHour,
      },
      entryAt: updated.entryAt,
      exitAt: updated.exitAt,
      durationMs: ms,
      hoursBilled,
      chargedAmount: updated.chargedAmount,
      currency: "RWF",
      lineItems: [
        {
          description: `Parking (${hoursBilled} billed hour(s) at ${updated.parking.feePerHour} per hour)`,
          amount: updated.chargedAmount,
        },
      ],
    };

    res.json({ success: true, data: { session: updated, bill } });
  } catch (e) {
    next(e);
  }
});
