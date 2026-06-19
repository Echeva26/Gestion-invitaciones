import { prisma } from "@/lib/db";
import { isoWeekRange, nextDay } from "@/lib/dates";
import type { Settings } from "@/lib/rules";

export async function getSettings(): Promise<Settings & { communityName: string }> {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("No hay normas configuradas. Ejecuta el seed (npm run db:seed).");
  return {
    communityName: s.communityName,
    poolCapacity: s.poolCapacity,
    maxGuestsPerDay: s.maxGuestsPerDay,
    maxGuestsPerWeek: s.maxGuestsPerWeek,
    maxGuestsPerSeason: s.maxGuestsPerSeason,
    seasonStart: s.seasonStart,
    seasonEnd: s.seasonEnd,
  };
}

async function sumGuests(where: object): Promise<number> {
  const res = await prisma.guestDeclaration.aggregate({
    _sum: { guests: true },
    where: { status: "ACTIVE", ...where },
  });
  return res._sum.guests ?? 0;
}

/**
 * Calcula los totales necesarios para validar una nueva declaración del
 * propietario `ownerId` en el día `day` (UTC 00:00).
 */
export async function computeTotals(ownerId: string, day: Date) {
  const week = isoWeekRange(day);
  const settings = await getSettings();

  const [ownerDayTotal, ownerWeekTotal, ownerSeasonTotal, communityDayTotal] =
    await Promise.all([
      sumGuests({ ownerId, date: { gte: day, lt: nextDay(day) } }),
      sumGuests({ ownerId, date: { gte: week.start, lt: week.end } }),
      sumGuests({
        ownerId,
        date: { gte: settings.seasonStart, lte: settings.seasonEnd },
      }),
      sumGuests({ date: { gte: day, lt: nextDay(day) } }),
    ]);

  return { settings, ownerDayTotal, ownerWeekTotal, ownerSeasonTotal, communityDayTotal };
}
