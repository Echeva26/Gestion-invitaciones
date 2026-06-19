# Arquitectura

## Visión general

App **full-stack monolítica** sobre Next.js 16 (App Router) + React 19. El frontend (React Server
Components + algunos client components) y el backend (route handlers bajo `/api`) viven en
el mismo proyecto y se despliegan juntos. La persistencia es PostgreSQL vía Prisma.

```
Navegador
   │  (HTML + JS)
   ▼
Next.js (App Router)
   ├── Server Components  → leen sesión + BD y renderizan en el servidor
   ├── Client Components  → formularios interactivos (declarar, normas, propietarios)
   ├── Route Handlers /api → API JSON (validación con zod → motor de reglas → Prisma)
   └── proxy.ts           → protege /dashboard y /admin (verifica JWT en el Edge)
   ▼
Prisma  →  PostgreSQL (Neon en producción)
```

## Estructura de carpetas

```
abedul-piscina/
├── CLAUDE.md                 Resumen + arranque (apunta a docs/)
├── docs/                     Esta documentación
├── prisma/
│   ├── schema.prisma         Modelo de datos
│   └── seed.ts               Datos iniciales (normas, admin, propietarios demo)
└── src/
    ├── proxy.ts              Guard de rutas protegidas (Edge runtime, solo JWT) — antes middleware.ts
    ├── lib/
    │   ├── db.ts             Cliente Prisma (singleton)
    │   ├── auth.ts           Sesión JWT + tokens mágicos
    │   ├── constants.ts      Constantes seguras para el Edge (nombre de cookie, TTLs)
    │   ├── email.ts          Envío de enlaces mágicos (o log en dev)
    │   ├── dates.ts          Normalización de fechas a UTC, semana ISO (+ dates.test.ts)
    │   ├── rules.ts          ⭐ Motor de validación (puro, sin BD) (+ rules.test.ts)
    │   └── quotas.ts         Cálculo de totales/cupos desde BD
    ├── components/           Client components (formularios, listas)
    └── app/
        ├── page.tsx          Login (solicitar enlace mágico)
        ├── dashboard/        Panel del propietario
        ├── admin/            Panel de administración
        ├── auth/verify/      Verificación del enlace mágico → crea sesión
        └── api/              Endpoints JSON (ver api.md)
```

## Flujo de datos: declarar invitados

1. El propietario elige día y nº de invitados en el `DeclarationForm` (client component).
2. Al elegir día, el form consulta `GET /api/declarations?date=…` y muestra los **cupos
   restantes** (vista previa, sin comprometer nada).
3. Al enviar, `POST /api/declarations`:
   - valida la entrada con **zod**,
   - `computeTotals()` ([quotas.ts](../src/lib/quotas.ts)) calcula los totales del propietario
     (día/semana/temporada) y de la comunidad (aforo) desde la BD,
   - `validateDeclaration()` ([rules.ts](../src/lib/rules.ts)) decide si cumple las normas,
   - si cumple, crea la `GuestDeclaration`; si no, devuelve `422` con la lista de incumplimientos.
4. El panel de admin agrega las declaraciones **por día** para mostrar la ocupación prevista.

## Decisiones de diseño

- **Motor de reglas puro y separado de la BD.** `rules.ts` recibe números, no consulta nada.
  Esto lo hace trivial de testear y permite reutilizar la lógica de "cuántos puedo traer" en el
  cliente sin duplicar reglas. `quotas.ts` es la frontera que toca la BD.
- **Validación en el servidor siempre.** El cliente solo da una vista previa amable; la decisión
  vinculante se toma en `POST` con datos frescos de la BD (evita condiciones de carrera y
  manipulación del cliente).
- **Proxy ligero** (`proxy.ts`, antes `middleware.ts`). Corre en el Edge runtime, donde Prisma no
  está disponible, así que solo verifica la firma del JWT importando `SESSION_COOKIE` de
  `constants.ts` (no de `auth.ts`, para no arrastrar `crypto` al bundle de Edge). El control fino
  de rol (ADMIN) se hace en cada página/endpoint con `getSession()`.
- **Soft-delete de declaraciones.** Cancelar marca `status = CANCELLED` en vez de borrar, para
  conservar histórico.
- **Fechas siempre en UTC, sin date-fns.** Las funciones de date-fns operan en hora local y
  provocaban errores de ±1 día. `dates.ts` hace la aritmética en UTC a mano. Hay tests
  (`dates.test.ts`) que fijan este comportamiento.

## Tests

`npm test` (Vitest) cubre la lógica pura: el motor de reglas ([rules.test.ts](../src/lib/rules.test.ts))
y la normalización de fechas/semana ISO ([dates.test.ts](../src/lib/dates.test.ts)). Son los puntos
donde un fallo silencioso (un cupo mal contado, un día desplazado) tendría más impacto.
