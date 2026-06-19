# Auto-fix de bugs con agente

Pipeline que, cuando aparece un bug en producción, hace que un **agente Claude** lo
investigue y proponga un arreglo en un **Pull Request**, te avise por **email**, y solo
redespliegue **tras tu aprobación**. El agente nunca mergea ni despliega por su cuenta.

## Flujo completo

```
Usuario provoca un error en producción
        │
        ▼
 Sentry lo captura  ──►  crea un issue en GitHub con la etiqueta "production-bug"
        │
        ▼
 Workflow auto-fix.yml  (.github/workflows/auto-fix.yml)
   1. Crea una rama aislada           auto-fix/issue-N-<runid>
   2. El agente Claude lee el error y el código, escribe el fix
   3. Verifica: npm test + npm run build
   4. Abre un Pull Request (NUNCA a main directamente)
   5. 📧 Email a jorge.echevarria.uri@gmail.com con el resumen + enlace al PR
   6. Comenta en el issue con el enlace
        │
        ▼
   ⏸  TÚ REVISAS EL PR  ⏸
        │  (apruebas haciendo merge)
        ▼
 Push a main  ──►  ci-cd.yml  (test → build → deploy)
        │
        ▼
   ⏸  GATE: environment "production"  ⏸
        │  GitHub te envía email "esperando aprobación"; apruebas con un clic
        ▼
 Deploy a Vercel (producción)
```

**Doble freno humano**: (1) el PR no se mergea solo y (2) el deploy se detiene en el
environment `production` pidiendo tu aprobación. Nada llega a producción sin tu clic.

## Disparadores

- **Automático**: Sentry detecta un error y crea un issue etiquetado `production-bug`.
- **Manual por etiqueta**: añade la etiqueta `production-bug` a cualquier issue existente.
- **Manual directo**: en GitHub → Actions → *Auto-fix de bugs (agente)* → *Run workflow*,
  describiendo el fallo en el campo de texto.

## Lo que ya está configurado en el repo

- `.github/workflows/auto-fix.yml` — el agente y la apertura del PR + email.
- `.github/scripts/notify-review.mjs` — email de verificación (vía el mismo SMTP).
- `ci-cd.yml` → job `deploy` con `environment: production` (gate de aprobación).
- Environment `production` con **Echeva26** como *reviewer* obligatorio.
- Etiqueta `production-bug`.
- Secrets en GitHub: `SMTP_*`, `VERCEL_*`.
- Instrumentación de Sentry en el código (`src/instrumentation.ts`,
  `src/instrumentation-client.ts`, `next.config.mjs`) — **inerte hasta que haya DSN**.

## Checklist para activarlo (lo que debes hacer tú)

### 1. Clave de API de Anthropic (obligatorio para el agente)
1. Crea una API key en <https://console.anthropic.com/> (Settings → API Keys).
2. Guárdala como secret del repo:
   ```bash
   gh secret set ANTHROPIC_API_KEY --repo Echeva26/Gestion-invitaciones --body "sk-ant-..."
   ```
   > Es de pago por uso (céntimos por ejecución del agente).

### 2. Sentry (detección automática de bugs)
1. Crea una cuenta gratuita en <https://sentry.io/> y un proyecto **Next.js**.
2. Copia el **DSN** del proyecto y añádelo como variables de entorno en Vercel
   (Production), ambas con el mismo valor:
   - `SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_DSN`
   ```bash
   # ejemplo con la CLI de Vercel
   printf '%s' "https://...@oXXXX.ingest.sentry.io/XXXX" | vercel env add SENTRY_DSN production --scope echeva26s-projects
   printf '%s' "https://...@oXXXX.ingest.sentry.io/XXXX" | vercel env add NEXT_PUBLIC_SENTRY_DSN production --scope echeva26s-projects
   ```
3. (Opcional, para stack traces legibles) crea un **Auth Token** en Sentry y añade en Vercel
   `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
4. **Conecta Sentry con GitHub** para que cree issues automáticamente:
   - En Sentry: *Settings → Integrations → GitHub* → instala y autoriza el repo.
   - Crea una **Alert Rule**: *cuando se cree un nuevo issue (error)* → acción
     *"Create a GitHub issue"* en `Echeva26/Gestion-invitaciones` con la etiqueta
     `production-bug`.
5. Redespliega para que el DSN tome efecto (push a `main` o un redeploy en Vercel).

### 3. Probar el pipeline sin esperar a un bug real
- GitHub → Actions → *Auto-fix de bugs (agente)* → *Run workflow* → describe un fallo
  ficticio o real. Verás al agente abrir un PR y te llegará el email.

## Ajustes y seguridad

- **Coste acotado**: el agente solo corre al detectarse/etiquetarse un bug; `concurrency`
  evita varios a la vez sobre el mismo issue.
- **Sin auto-merge ni auto-deploy**: regla explícita en el prompt + el gate del environment.
- El agente trabaja en runner efímero con `--dangerously-skip-permissions` (aislado), pero
  tiene **prohibido** ejecutar git/gh/deploy y solo puede editar ficheros y correr tests.
- Si el agente no encuentra arreglo, no abre PR (no molesta).
