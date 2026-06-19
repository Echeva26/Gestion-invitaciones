# API HTTP

Todos los endpoints viven bajo `src/app/api/`. Las respuestas son JSON. La sesión viaja en una
cookie `httpOnly` (`abedul_session`); no hay tokens en cabeceras.

## Autenticación

### `POST /api/auth/request`
Solicita un enlace mágico.
```json
{ "email": "maria@example.com" }
```
Responde siempre `200` con mensaje genérico (no revela si el email existe). Si el email
pertenece a un propietario activo, se le envía (o registra en consola) un enlace.

### `GET /auth/verify?token=…`
Verifica el token mágico, lo marca como usado, crea la sesión y **redirige** a `/admin`
(si ADMIN) o `/dashboard`. Si el token es inválido/caducado, redirige a `/?error=…`.

### `POST /api/auth/logout`
Borra la cookie de sesión.

## Declaraciones de invitados

### `GET /api/declarations`
Devuelve las declaraciones activas del propietario autenticado.
- Con `?date=YYYY-MM-DD` añade `remaining` (cupos restantes de ese día: `day`, `week`,
  `season`, `capacity`).
```json
{ "declarations": [ … ], "remaining": { "day": 4, "week": 8, "season": 6, "capacity": 41 } }
```

### `POST /api/declarations`
Crea una declaración tras validar todas las normas.
```json
{ "date": "2026-07-12", "guests": 3, "note": "visita familiar" }
```
- `201` → `{ ok: true, declaration }`
- `422` → `{ error, violations: [{ code, message }] }` (incumple normas)
- `400` → datos inválidos · `401` → no autenticado

### `DELETE /api/declarations/:id`
Cancela (soft-delete) una declaración **propia**. `404` si no existe o no es del propietario.

## Administración (solo rol ADMIN → `403` en caso contrario)

### `PUT /api/rules`
Actualiza las normas de la comunidad.
```json
{
  "communityName": "Comunidad Abedul",
  "poolCapacity": 45,
  "maxGuestsPerDay": 4,
  "maxGuestsPerWeek": 8,
  "maxGuestsPerSeason": 10,
  "seasonStart": "2026-06-01",
  "seasonEnd": "2026-09-15"
}
```

### `GET /api/owners`
Lista todos los propietarios.

### `POST /api/owners`
Da de alta un propietario.
```json
{ "name": "Juan Pérez", "email": "juan@example.com", "unit": "Portal 1 · 2ºB", "role": "OWNER" }
```
`409` si el email ya existe.

### `PATCH /api/owners/:id`
Actualiza un propietario (p.ej. `{ "active": false }` para desactivar el acceso).
