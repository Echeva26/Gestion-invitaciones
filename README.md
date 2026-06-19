# 🏊 Abedul Piscina

Web app para el **control de invitaciones a la piscina** de una comunidad de propietarios.
Los propietarios declaran cuántos invitados traerán y qué día; el sistema aplica las normas
de la comunidad (cupos por día / semana / temporada + aforo) y rechaza lo que las incumpla,
explicando el motivo. El control físico de acceso queda fuera de scope.

## Arranque rápido

```bash
npm install
cp .env.example .env     # configura AUTH_SECRET y DATABASE_URL (Postgres)
npm run setup            # prisma generate + crea las tablas + seed inicial
npm run dev              # http://localhost:3000
npm test                 # tests (vitest)
```

> Requiere una `DATABASE_URL` de PostgreSQL (en local, una rama de Neon gratuita o un Postgres
> con Docker). Sin SMTP configurado, **el enlace mágico de acceso se imprime en la consola** del
> servidor. Entra con `admin@abedul.example` para acceder como administrador.

## Documentación

- Resumen y convenciones para desarrollo → [CLAUDE.md](CLAUDE.md)
- Documentación completa (arquitectura, modelo de datos, reglas, API, auth, roadmap) → [`docs/`](docs/)

## Stack

Next.js 16 + React 19 (App Router, TypeScript) · Prisma + PostgreSQL (Neon) · Tailwind CSS ·
Vitest · auth sin contraseña (enlaces mágicos por email + sesión JWT).

Para desplegar en producción (Vercel + Neon, gratis) con CI/CD y configurar el correo, ver
[docs/despliegue.md](docs/despliegue.md).
