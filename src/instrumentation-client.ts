import * as Sentry from "@sentry/nextjs";

/**
 * Instrumentación de cliente (navegador) para Sentry.
 *
 * Solo se inicializa si existe NEXT_PUBLIC_SENTRY_DSN. Sin esa variable la app
 * funciona igual y no se carga ni envía nada desde el navegador.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

// Captura errores durante las transiciones de navegación del App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
