// Constantes seguras para el Edge runtime (sin dependencias de Node).
// El middleware las importa sin arrastrar `crypto` ni `next/headers`.

export const SESSION_COOKIE = "abedul_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días
export const MAGIC_TTL_MINUTES = 15;
