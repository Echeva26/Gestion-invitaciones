/**
 * Motor de validación de invitaciones.
 *
 * Es código puro (sin acceso a base de datos): recibe las normas y los totales
 * ya calculados, y decide si una declaración es válida. Esto lo hace fácil de
 * testear y reutilizar tanto en el servidor (al guardar) como en el cliente
 * (para avisar al propietario antes de enviar).
 *
 * Ver docs/reglas-negocio.md para la explicación funcional.
 */

export type Settings = {
  poolCapacity: number;
  maxGuestsPerDay: number;
  maxGuestsPerWeek: number;
  maxGuestsPerSeason: number;
  seasonStart: Date;
  seasonEnd: Date;
};

export type ValidationInput = {
  /** Día de la visita (UTC 00:00). */
  date: Date;
  /** Nº de invitados que se quieren declarar ahora. */
  guests: number;
  settings: Settings;
  /** Invitados ya declarados (ACTIVE) por este propietario ese mismo día. */
  ownerDayTotal: number;
  /** Invitados ya declarados por este propietario en la semana ISO del día. */
  ownerWeekTotal: number;
  /** Invitados ya declarados por este propietario en toda la temporada. */
  ownerSeasonTotal: number;
  /** Invitados de TODA la comunidad ese día (para el aforo). */
  communityDayTotal: number;
};

export type Violation = {
  code:
    | "GUESTS_MIN"
    | "OUT_OF_SEASON"
    | "DAY_LIMIT"
    | "WEEK_LIMIT"
    | "SEASON_LIMIT"
    | "CAPACITY";
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  violations: Violation[];
};

/** Cupos restantes ANTES de aplicar la nueva declaración. */
export type Remaining = {
  day: number;
  week: number;
  season: number;
  capacity: number;
};

export function remainingQuotas(input: Omit<ValidationInput, "guests">): Remaining {
  const { settings, ownerDayTotal, ownerWeekTotal, ownerSeasonTotal, communityDayTotal } =
    input;
  return {
    day: Math.max(0, settings.maxGuestsPerDay - ownerDayTotal),
    week: Math.max(0, settings.maxGuestsPerWeek - ownerWeekTotal),
    season: Math.max(0, settings.maxGuestsPerSeason - ownerSeasonTotal),
    capacity: Math.max(0, settings.poolCapacity - communityDayTotal),
  };
}

export function validateDeclaration(input: ValidationInput): ValidationResult {
  const { date, guests, settings } = input;
  const violations: Violation[] = [];

  if (!Number.isInteger(guests) || guests < 1) {
    violations.push({ code: "GUESTS_MIN", message: "Debes declarar al menos 1 invitado." });
    return { ok: false, violations };
  }

  // Fuera de temporada.
  const day = date.getTime();
  if (day < settings.seasonStart.getTime() || day > settings.seasonEnd.getTime()) {
    violations.push({
      code: "OUT_OF_SEASON",
      message: "La fecha está fuera de la temporada de piscina.",
    });
  }

  const r = remainingQuotas(input);

  if (guests > r.day) {
    violations.push({
      code: "DAY_LIMIT",
      message: `Superas el máximo diario: te quedan ${r.day} invitado(s) para ese día (límite ${settings.maxGuestsPerDay}).`,
    });
  }

  if (guests > r.week) {
    violations.push({
      code: "WEEK_LIMIT",
      message: `Superas el máximo semanal: te quedan ${r.week} invitado(s) esta semana (límite ${settings.maxGuestsPerWeek}).`,
    });
  }

  if (guests > r.season) {
    violations.push({
      code: "SEASON_LIMIT",
      message: `Superas el máximo de temporada: te quedan ${r.season} invitado(s) (límite ${settings.maxGuestsPerSeason}).`,
    });
  }

  if (guests > r.capacity) {
    violations.push({
      code: "CAPACITY",
      message: `No hay aforo suficiente ese día: quedan ${r.capacity} plaza(s) de invitado de ${settings.poolCapacity}.`,
    });
  }

  return { ok: violations.length === 0, violations };
}
