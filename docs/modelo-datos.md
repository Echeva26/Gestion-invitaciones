# Modelo de datos

Definido en [prisma/schema.prisma](../prisma/schema.prisma). Base de datos: **PostgreSQL**
(Neon en producción; ver [despliegue.md](despliegue.md)).

## Entidades

### Owner — propietario / administrador
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string (cuid) | PK |
| `name` | string | Nombre del propietario |
| `email` | string | **Único.** Identificador de acceso (enlace mágico) |
| `unit` | string | Vivienda, p.ej. `"Portal 2 · 3ºB"` |
| `role` | string | `OWNER` \| `ADMIN` |
| `active` | bool | Si `false`, no puede acceder |
| `createdAt` | datetime | |

Los propietarios los **da de alta la administración** (no hay registro abierto): solo quien
está en la lista puede solicitar un enlace de acceso.

### GuestDeclaration — declaración de invitados
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string (cuid) | PK |
| `ownerId` | string | FK → Owner (cascade) |
| `date` | datetime | Día de la visita, **medianoche UTC** |
| `guests` | int | Nº de invitados (≥ 1) |
| `note` | string? | Nota opcional (p.ej. "visita familiar") |
| `status` | string | `ACTIVE` \| `CANCELLED` (soft-delete) |
| `createdAt` | datetime | |

Índices en `date` y `(ownerId, date)` para las consultas de cupos.

### MagicToken — token de acceso de un solo uso
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string (cuid) | PK |
| `ownerId` | string | FK → Owner (cascade) |
| `tokenHash` | string | **Único.** sha256 del token; nunca se guarda en claro |
| `expiresAt` | datetime | Caduca a los 15 min |
| `usedAt` | datetime? | Se marca al usarlo (un solo uso) |
| `createdAt` | datetime | |

### Settings — normas de la comunidad
Fila **única** (`id = 1`) al ser mono-comunidad.

| Campo | Tipo | Por defecto | Significado |
|-------|------|-------------|-------------|
| `communityName` | string | "Comunidad Abedul" | Nombre mostrado |
| `poolCapacity` | int | 45 | Aforo total de la piscina |
| `maxGuestsPerDay` | int | 4 | Máx. invitados por propietario y día |
| `maxGuestsPerWeek` | int | 8 | Máx. invitados por propietario y semana (ISO) |
| `maxGuestsPerSeason` | int | 10 | Máx. invitados por propietario y temporada |
| `seasonStart` / `seasonEnd` | datetime | jun–sep | Ventana de temporada |

## Decisión: fechas a medianoche UTC

Una declaración cuenta **un día**, sin hora. Para que las sumas de cupos sean consistentes y
no dependan de la zona horaria del navegador o del servidor, toda fecha de visita se normaliza
a `Date.UTC(año, mes, día)` en [src/lib/dates.ts](../src/lib/dates.ts). La semana se calcula
como **semana ISO** (lunes–domingo) sobre esa fecha normalizada.

## Decisión: `Settings` como fila única

Mientras sea mono-comunidad, las normas son una sola fila. Para multi-comunidad se introduciría
un modelo `Community` y `Settings`/`Owner` pasarían a tener `communityId` — ver
[roadmap.md](roadmap.md).
