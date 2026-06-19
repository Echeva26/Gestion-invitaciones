import { PrismaClient } from "@prisma/client";

// Reutiliza una única instancia de Prisma en desarrollo para evitar
// agotar las conexiones con el hot-reload de Next.js.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
