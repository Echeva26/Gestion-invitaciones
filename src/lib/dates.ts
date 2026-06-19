// Toda la lógica de fechas trabaja en UTC. Una declaración cuenta un día
// (sin hora), así que normalizamos cada fecha a medianoche UTC. NO usamos
// date-fns aquí porque sus funciones operan en hora LOCAL, lo que provoca
// errores de ±1 día según la zona horaria del servidor.

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Normaliza una fecha a medianoche UTC.
 * - Un string "YYYY-MM-DD" se interpreta directamente como ese día en UTC.
 * - Un `Date` se toma por sus componentes UTC (debe representar ya un instante
 *   cuyo día de calendario UTC es el que queremos).
 */
export function toUtcDay(input: string | Date): Date {
  if (typeof input === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (!m) throw new Error("Fecha inválida");
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }
  if (Number.isNaN(input.getTime())) throw new Error("Fecha inválida");
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

/**
 * Recibe un objeto Date en UTC y devuelve la fecha en formato "YYYY-MM-DD".
 * Devuelve "YYYY-MM-DD" leyendo los componentes en UTC. Estable sea cual sea
 * la zona horaria del servidor.
 */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Rango [lunes 00:00 UTC, lunes siguiente 00:00 UTC) de la semana ISO que
 * contiene `day`. Usado para el cupo semanal.
 */
export function isoWeekRange(day: Date): { start: Date; end: Date } {
  const d = toUtcDay(day);
  const mondayOffset = (d.getUTCDay() + 6) % 7; // lunes = 0, domingo = 6
  const start = new Date(d.getTime() - mondayOffset * DAY_MS);
  const end = new Date(start.getTime() + 7 * DAY_MS);
  return { start, end };
}

/** Día siguiente (00:00 UTC) — útil para rangos [día, díaSiguiente). */
export function nextDay(day: Date): Date {
  return new Date(toUtcDay(day).getTime() + DAY_MS);
}
