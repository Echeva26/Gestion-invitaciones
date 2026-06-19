import { describe, it, expect } from "vitest";
import { validateDeclaration, remainingQuotas, type Settings } from "./rules";

const settings: Settings = {
  poolCapacity: 45,
  maxGuestsPerDay: 4,
  maxGuestsPerWeek: 8,
  maxGuestsPerSeason: 10,
  seasonStart: new Date("2026-06-01T00:00:00.000Z"),
  seasonEnd: new Date("2026-09-15T00:00:00.000Z"),
};

// Día dentro de temporada.
const inSeason = new Date("2026-07-12T00:00:00.000Z");

/** Totales "a cero": el propietario aún no ha declarado nada. */
const zeroTotals = {
  settings,
  ownerDayTotal: 0,
  ownerWeekTotal: 0,
  ownerSeasonTotal: 0,
  communityDayTotal: 0,
};

describe("validateDeclaration", () => {
  it("acepta una declaración válida dentro de todos los límites", () => {
    const r = validateDeclaration({ date: inSeason, guests: 3, ...zeroTotals });
    expect(r.ok).toBe(true);
    expect(r.violations).toHaveLength(0);
  });

  it("acepta exactamente el límite diario", () => {
    const r = validateDeclaration({ date: inSeason, guests: 4, ...zeroTotals });
    expect(r.ok).toBe(true);
  });

  it("rechaza por debajo de 1 invitado", () => {
    const r = validateDeclaration({ date: inSeason, guests: 0, ...zeroTotals });
    expect(r.ok).toBe(false);
    expect(r.violations[0].code).toBe("GUESTS_MIN");
  });

  it("rechaza fuera de temporada (antes del inicio)", () => {
    const r = validateDeclaration({
      date: new Date("2026-01-10T00:00:00.000Z"),
      guests: 1,
      ...zeroTotals,
    });
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.code)).toContain("OUT_OF_SEASON");
  });

  it("rechaza fuera de temporada (después del fin)", () => {
    const r = validateDeclaration({
      date: new Date("2026-10-01T00:00:00.000Z"),
      guests: 1,
      ...zeroTotals,
    });
    expect(r.violations.map((v) => v.code)).toContain("OUT_OF_SEASON");
  });

  it("rechaza por superar el cupo diario (caso del cliente: pide 5, tope 4)", () => {
    const r = validateDeclaration({ date: inSeason, guests: 5, ...zeroTotals });
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.code)).toContain("DAY_LIMIT");
  });

  it("tiene en cuenta lo ya declarado ese día", () => {
    // Ya tiene 3 ese día (quedan 1); pide 2 → supera el diario.
    const r = validateDeclaration({
      date: inSeason,
      guests: 2,
      ...zeroTotals,
      ownerDayTotal: 3,
    });
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.code)).toContain("DAY_LIMIT");
  });

  it("rechaza por cupo semanal aunque el diario lo permita", () => {
    // Ya lleva 8 en la semana (tope semanal); el día está a cero.
    const r = validateDeclaration({
      date: inSeason,
      guests: 1,
      ...zeroTotals,
      ownerWeekTotal: 8,
    });
    expect(r.violations.map((v) => v.code)).toContain("WEEK_LIMIT");
    expect(r.violations.map((v) => v.code)).not.toContain("DAY_LIMIT");
  });

  it("rechaza por cupo de temporada", () => {
    const r = validateDeclaration({
      date: inSeason,
      guests: 1,
      ...zeroTotals,
      ownerSeasonTotal: 10,
    });
    expect(r.violations.map((v) => v.code)).toContain("SEASON_LIMIT");
  });

  it("rechaza por aforo de la comunidad", () => {
    const r = validateDeclaration({
      date: inSeason,
      guests: 1,
      ...zeroTotals,
      communityDayTotal: 45,
    });
    expect(r.violations.map((v) => v.code)).toContain("CAPACITY");
  });

  it("acumula varias violaciones a la vez", () => {
    const r = validateDeclaration({
      date: new Date("2026-01-10T00:00:00.000Z"), // fuera de temporada
      guests: 10, // supera diario, semanal, temporada
      ...zeroTotals,
    });
    expect(r.ok).toBe(false);
    expect(r.violations.length).toBeGreaterThan(1);
  });

  it("invitados ilimitados de facto con topes muy altos", () => {
    const generoso: Settings = {
      ...settings,
      maxGuestsPerDay: 999,
      maxGuestsPerWeek: 999,
      maxGuestsPerSeason: 999,
    };
    const r = validateDeclaration({ date: inSeason, guests: 20, ...zeroTotals, settings: generoso });
    expect(r.ok).toBe(true);
  });

  it("invitados prohibidos con topes a 0", () => {
    const sinInvitados: Settings = { ...settings, maxGuestsPerDay: 0 };
    const r = validateDeclaration({ date: inSeason, guests: 1, ...zeroTotals, settings: sinInvitados });
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.code)).toContain("DAY_LIMIT");
  });
});

describe("remainingQuotas", () => {
  it("calcula los cupos restantes en cada dimensión", () => {
    const r = remainingQuotas({
      date: inSeason,
      settings,
      ownerDayTotal: 3,
      ownerWeekTotal: 5,
      ownerSeasonTotal: 7,
      communityDayTotal: 40,
    });
    expect(r).toEqual({ day: 1, week: 3, season: 3, capacity: 5 });
  });

  it("nunca devuelve negativos", () => {
    const r = remainingQuotas({
      date: inSeason,
      settings,
      ownerDayTotal: 100,
      ownerWeekTotal: 100,
      ownerSeasonTotal: 100,
      communityDayTotal: 100,
    });
    expect(r).toEqual({ day: 0, week: 0, season: 0, capacity: 0 });
  });
});
