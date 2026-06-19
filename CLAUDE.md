# Abedul Piscina

Web app para el **control de invitaciones a la piscina** de comunidades de propietarios.
Los propietarios declaran con antelación cuántos invitados traerán y qué día; el sistema
aplica automáticamente las normas de la comunidad (cupos por día/semana/temporada y aforo).
El **control físico de acceso** queda fuera de scope.

> Actualmente configurada para una sola comunidad (**Abedul**). El diseño deja preparada
> la extensión a multi-comunidad — ver [docs/roadmap.md](docs/roadmap.md).

## Stack

- **Next.js 16** (App Router, TypeScript) + **React 19** — frontend + API routes en un solo proyecto
- **Prisma + PostgreSQL** (Neon en producción) — persistencia
- **Tailwind CSS** — estilos
- **jose** (JWT de sesión) + **nodemailer** (enlaces mágicos) para autenticación sin contraseña
- **Vitest** — tests unitarios del motor de reglas y de fechas

> La protección de rutas vive en [src/proxy.ts](src/proxy.ts) (el antiguo `middleware.ts`,
> renombrado a `proxy.ts` en Next 16).

## Arranque rápido

```bash
npm install
cp .env.example .env          # edita AUTH_SECRET y DATABASE_URL (Postgres)
npm run setup                 # prisma generate + db push + seed
npm run dev                   # http://localhost:3000
npm test                      # tests (vitest) — no requieren base de datos
```

Necesitas una `DATABASE_URL` de PostgreSQL incluso en local (p.ej. una rama de desarrollo
gratuita de Neon, o un Postgres local con Docker). Sin SMTP configurado, **el enlace mágico se
imprime en la consola** del servidor en lugar de enviarse por email. Inicia sesión con
`ADMIN_EMAIL` (por defecto `admin@abedul.example`) para entrar como administrador.

Para producción (Vercel + Neon, gratis) y el pipeline de CI/CD, ver [docs/despliegue.md](docs/despliegue.md).

## Documentación

Toda la documentación detallada vive en [`docs/`](docs/):

| Documento | Contenido |
|-----------|-----------|
| [docs/arquitectura.md](docs/arquitectura.md) | Visión general, estructura de carpetas, flujo de datos |
| [docs/modelo-datos.md](docs/modelo-datos.md) | Entidades, esquema Prisma, decisiones sobre fechas |
| [docs/reglas-negocio.md](docs/reglas-negocio.md) | Normas de invitados y motor de validación |
| [docs/api.md](docs/api.md) | Endpoints HTTP |
| [docs/autenticacion.md](docs/autenticacion.md) | Enlaces mágicos, sesiones, roles |
| [docs/despliegue.md](docs/despliegue.md) | Despliegue (Vercel/Neon o SQLite en disco), variables de entorno, correo |
| [docs/auto-fix.md](docs/auto-fix.md) | Pipeline de auto-fix: Sentry → agente → PR → aprobación → redespliegue |
| [docs/roadmap.md](docs/roadmap.md) | Limitaciones, control de acceso, multi-comunidad |

## Convenciones

- El **motor de reglas** ([src/lib/rules.ts](src/lib/rules.ts)) es código puro sin acceso a BD:
  se testea y se reutiliza tanto en servidor (al guardar) como en cliente (vista previa de cupos).
- Las fechas de visita se normalizan a **medianoche UTC** ([src/lib/dates.ts](src/lib/dates.ts))
  con aritmética propia (sin date-fns, que opera en hora local) para que las sumas de cupos no
  dependan de la zona horaria del servidor.
- La validación de entrada usa **zod** en cada route handler.
- Los componentes cliente que listan datos del servidor (p.ej.
  [DeclarationList](src/components/DeclarationList.tsx)) **derivan de las props**, no de estado
  local: tras crear/cancelar se llama a `router.refresh()` y el servidor es la fuente de verdad.
