# Despliegue

Plataforma elegida (la más económica): **Vercel** (plan Hobby, gratis) + **Neon** (Postgres
serverless, free tier). Coste **0 €/mes** para una comunidad. El despliegue se automatiza con
**GitHub Actions**: cada push a `main` ejecuta tests + build y, si pasan, despliega a producción.

> No usamos SQLite en producción: el sistema de ficheros de Vercel es efímero y se perdería la
> base de datos. Por eso la app usa PostgreSQL (Neon). El `proxy.ts` (protección de rutas) corre
> en el Edge runtime de Vercel sin configuración extra.

---

## Resumen de pasos

1. [Crear la base de datos en Neon](#1-base-de-datos-neon)
2. [Subir el esquema y los datos iniciales](#2-esquema-y-seed)
3. [Crear el proyecto en Vercel y sus variables de entorno](#3-proyecto-en-vercel)
4. [Configurar el correo (Gmail)](#4-correo-gmail)
5. [Activar el CI/CD (GitHub Actions)](#5-cicd-github-actions)

---

## 1. Base de datos (Neon)

1. Crea una cuenta en [neon.tech](https://neon.tech) (gratis).
2. Crea un proyecto. Copia la **connection string CON POOLER** (la que contiene `-pooler`),
   recomendada para serverless:
   ```
   postgresql://usuario:password@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Esta cadena será tu `DATABASE_URL`.

## 2. Esquema y seed

Con `DATABASE_URL` apuntando a Neon, crea las tablas y los datos iniciales (normas + admin).
Esto se hace **una sola vez** (y cada vez que cambie el esquema), desde tu máquina:

```bash
DATABASE_URL="postgresql://...neon-pooler..." npx prisma db push
DATABASE_URL="postgresql://...neon-pooler..." ADMIN_EMAIL="admin@tucomunidad.com" npm run db:seed
```

> Cambia `ADMIN_EMAIL` al email real de la administración: con ese email se inicia sesión como
> administrador.

## 3. Proyecto en Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com), *Add New → Project* e importa el repo. Vercel detecta
   Next.js automáticamente (el `build` ya incluye `prisma generate`).
3. En *Settings → Environment Variables*, añade las [variables de abajo](#variables-de-entorno)
   para el entorno **Production**.
4. **Desactiva los despliegues automáticos de Git de Vercel** para no duplicar con el pipeline:
   *Settings → Git → Ignored Build Step* o desconecta el auto-deploy. El deploy lo hará GitHub
   Actions (paso 5). *(Alternativa: si prefieres NO usar GitHub Actions, deja activado el
   auto-deploy de Vercel y omite el paso 5 — Vercel ya despliega en cada push.)*
5. La URL que te da Vercel (`https://tu-proyecto.vercel.app`) es tu `APP_URL`.

## 4. Correo (Gmail)

La app envía el enlace de acceso por email. En producción **necesitas SMTP** (sin `SMTP_HOST`,
el enlace solo se imprime en los logs). Gmail no admite tu contraseña normal: usa una
**App Password**.

1. Activa la **verificación en dos pasos** de la cuenta de Gmail
   (myaccount.google.com → Seguridad).
2. Crea una **Contraseña de aplicación** (myaccount.google.com → Seguridad → Contraseñas de
   aplicaciones → "Correo"). Son 16 caracteres.
3. Variables (ver tabla): `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
   `SMTP_USER=tucuenta@gmail.com`, `SMTP_PASS=la-app-password`,
   `SMTP_FROM=Piscina Abedul <tucuenta@gmail.com>`.

- Límite ~500 correos/día (de sobra para una comunidad).
- Con Gmail, `SMTP_FROM` debe ser la propia cuenta de Gmail (si no, irá a spam).
- *(Alternativa con dominio propio: Resend/Brevo/SendGrid, también gratis — mismas variables
  SMTP.)*

## 5. CI/CD (GitHub Actions)

El workflow [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) ya está en el repo.
Hace: **push a `main` → `npm ci` → `prisma generate` → `npm test` → `npm run build` → deploy a
Vercel**. En Pull Requests solo corre tests + build (no despliega).

Para que pueda desplegar, necesita tres **secrets** en GitHub
(*Settings → Secrets and variables → Actions → New repository secret*):

| Secret | De dónde sale |
|--------|---------------|
| `VERCEL_TOKEN` | Vercel → *Account Settings → Tokens* → crea un token. |
| `VERCEL_ORG_ID` | Ejecuta `vercel link` en el repo; aparece en `.vercel/project.json` como `orgId`. |
| `VERCEL_PROJECT_ID` | Igual, campo `projectId` de `.vercel/project.json`. |

Para obtener los dos IDs, una sola vez en tu máquina:
```bash
npm i -g vercel
vercel link          # vincula la carpeta con el proyecto de Vercel
cat .vercel/project.json   # copia orgId y projectId
```
(`.vercel/` está en `.gitignore`; los IDs se guardan como secrets, no en el repo.)

A partir de ahí, cada `git push` a `main` despliega automáticamente.

---

## Variables de entorno

Defínelas en **Vercel** (Production) y como **secrets** en GitHub solo las del deploy. Las de la
app las consume Vercel en tiempo de ejecución (y el workflow las descarga con `vercel pull`).

| Variable | Obligatoria | Descripción | Ejemplo |
|----------|:-----------:|-------------|---------|
| `DATABASE_URL` | ✅ | Connection string **con pooler** de Neon. | `postgresql://…-pooler…/neondb?sslmode=require` |
| `AUTH_SECRET` | ✅ | Secreto para firmar sesiones JWT (≥32 bytes, aleatorio). | (ver comando abajo) |
| `APP_URL` | ✅ | URL pública (para los enlaces mágicos). | `https://abedul.vercel.app` |
| `SMTP_HOST` | ✅ | Servidor SMTP. | `smtp.gmail.com` |
| `SMTP_PORT` | ➖ | Puerto SMTP. | `587` |
| `SMTP_USER` | ✅ | Usuario SMTP. | `tucuenta@gmail.com` |
| `SMTP_PASS` | ✅ | App Password de Gmail. | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | ➖ | Remitente visible. | `Piscina Abedul <tucuenta@gmail.com>` |
| `ADMIN_EMAIL` | ➖ | Email del admin (solo lo usa el `db:seed`). | `admin@tucomunidad.com` |
| `ADMIN_NAME` | ➖ | Nombre del admin del seed. | `Administración Abedul` |

Secrets de GitHub (solo para el deploy): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Generar `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Checklist de producción

- [ ] BD Neon creada y `DATABASE_URL` (con pooler) puesta en Vercel.
- [ ] `prisma db push` + `db:seed` ejecutados contra Neon (crea normas + admin).
- [ ] `ADMIN_EMAIL` del seed = email real de la administración.
- [ ] `AUTH_SECRET` aleatorio y distinto del de desarrollo.
- [ ] `APP_URL` = URL real de Vercel.
- [ ] SMTP (Gmail App Password) configurado y probado (pide un enlace y comprueba que llega).
- [ ] Secrets `VERCEL_*` en GitHub y auto-deploy de Vercel desactivado (para no duplicar).
- [ ] Primer `git push` a `main` → el workflow pasa en verde y despliega.
