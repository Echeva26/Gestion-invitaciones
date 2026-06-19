import { describe, it, expect } from "vitest";
import { toUtcDay, toDateString, isoWeekRange, nextDay } from "./dates";

describe("toUtcDay / toDateString", () => {
  it("normaliza un string YYYY-MM-DD a medianoche UTC", () => {
    const d = toUtcDay("2026-07-12");
    expect(d.toISOString()).toBe("2026-07-12T00:00:00.000Z");
  });

  it("ida y vuelta string → fecha → string", () => {
    expect(toDateString(toUtcDay("2026-08-01"))).toBe("2026-08-01");
  });

  it("lanza con fecha inválida", () => {
    expect(() => toUtcDay("no-es-fecha")).toThrow();
  });
});

describe("isoWeekRange", () => {
  it("el domingo 2026-07-12 pertenece a la semana que empieza el lunes 2026-07-06", () => {
    const { start, end } = isoWeekRange(toUtcDay("2026-07-12"));
    expect(toDateString(start)).toBe("2026-07-06"); // lunes
    expect(toDateString(end)).toBe("2026-07-13"); // lunes siguiente (exclusivo)
  });

  it("el lunes y el domingo de la misma semana dan el mismo rango", () => {
    const lunes = isoWeekRange(toUtcDay("2026-07-06"));
    const domingo = isoWeekRange(toUtcDay("2026-07-12"));
    expect(toDateString(lunes.start)).toBe(toDateString(domingo.start));
    expect(toDateString(lunes.end)).toBe(toDateString(domingo.end));
  });

  it("el rango es [lunes, lunes siguiente) y cubre 7 días", () => {
    const { start, end } = isoWeekRange(toUtcDay("2026-07-08"));
    const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBe(7);
  });
});

describe("nextDay", () => {
  it("avanza exactamente 24h", () => {
    expect(toDateString(nextDay(toUtcDay("2026-07-12")))).toBe("2026-07-13");
  });
});
