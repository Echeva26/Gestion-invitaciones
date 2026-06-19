# Autenticación

Acceso **sin contraseña** mediante enlaces mágicos por email. Encaja con el caso de uso: los
propietarios entran de vez en cuando (en temporada de piscina), y se evita gestionar
contraseñas en una comunidad de vecinos.

## Flujo

```
1. El propietario introduce su email en /  →  POST /api/auth/request
2. Si el email pertenece a un propietario activo:
   - se genera un token aleatorio (32 bytes), se guarda su sha256 en MagicToken
   - se envía un enlace  APP_URL/auth/verify?token=…  (caduca en 15 min)
3. El propietario abre el enlace  →  GET /auth/verify
   - se comprueba hash, caducidad y que no esté usado
   - se marca usedAt (un solo uso)
   - se crea la cookie de sesión (JWT firmado) y se redirige al panel
```

## Sesión

- JWT firmado con **HS256** usando `AUTH_SECRET`, guardado en cookie `abedul_session`
  (`httpOnly`, `sameSite=lax`, `secure` en producción), válido **30 días**.
- Payload: `{ ownerId, role, name }`.
- [src/lib/auth.ts](../src/lib/auth.ts) crea/verifica sesión y tokens mágicos.

## Roles y protección de rutas

- **OWNER** → panel `/dashboard` (declarar y gestionar sus invitados).
- **ADMIN** → panel `/admin` (normas, propietarios, ocupación) + acceso al dashboard.
- [src/proxy.ts](../src/proxy.ts) (el "middleware" de Next, renombrado a `proxy.ts` en Next 16)
  protege `/dashboard` y `/admin`: corre en el Edge runtime y **solo verifica la firma del JWT**
  (Prisma no está disponible ahí).
- El control fino ADMIN vs OWNER se hace en cada página/endpoint con `getSession()`.

## Buenas prácticas aplicadas

- Solo se guarda el **hash** del token mágico, nunca el token en claro.
- `POST /api/auth/request` responde igual exista o no el email (evita enumeración de usuarios).
- Tokens de **un solo uso** y caducidad corta (15 min).

## Configuración de email

Variables SMTP en `.env` (ver `.env.example`). **Sin `SMTP_HOST`, el enlace se imprime en la
consola del servidor** — pensado para desarrollo. En producción, configura un proveedor SMTP
(p.ej. el del hosting, SendGrid, Resend SMTP, etc.).
