import * as Sentry from "@sentry/nextjs";

/**
 * Instrumentación de servidor/edge para Sentry (Next 16).
 *
 * Solo se inicializa si existe SENTRY_DSN, de modo que en local o sin configurar
 * Sentry la app funciona igual y no envía nada. El DSN se pone como variable de
 * entorno en Vercel (ver docs/auto-fix.md).
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    // Muestreo de trazas de rendimiento (10%); los errores se capturan al 100%.
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

// Captura los errores que ocurren al manejar una request en el servidor
// (route handlers, Server Components). Es lo que detecta bugs como el de Prisma.
export const onRequestError = Sentry.captureRequestError;
