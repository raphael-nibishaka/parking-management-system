import { randomBytes } from "crypto";

export function generateTicketNumber(): string {
  const part = randomBytes(3).toString("hex").toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `TKT-${part}-${time}`;
}

export function computeParkingCharge(entryAt: Date, exitAt: Date, feePerHour: number): number {
  const ms = exitAt.getTime() - entryAt.getTime();
  if (ms <= 0) return 0;
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  const raw = hours * feePerHour;
  return Math.round(raw * 100) / 100;
}

export function parsePagination(query: { page?: string; limit?: string }) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
