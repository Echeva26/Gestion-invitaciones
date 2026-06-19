import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// withSentryConfig añade la instrumentación de Sentry al build. La subida de
// source maps solo ocurre si hay SENTRY_AUTH_TOKEN + org/project; si no, se omite
// (build local/CI sin esos secrets sigue funcionando, solo sin mapas legibles).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});
