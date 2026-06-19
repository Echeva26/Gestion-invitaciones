# Roadmap y limitaciones

## Fuera de scope (por decisión del proyecto)

- **Control físico de acceso a la piscina.** No hay torno, lector ni vigilante. La app gestiona
  *quién está autorizado*, no *quién entra físicamente*. El cliente lo dejó claro: el hardware
  de control de accesos lo vende cualquier empresa especializada.

## Limitaciones conocidas del MVP

- El **aforo** cuenta solo invitados declarados, no propietarios presentes (no hay forma de
  saber quién baja). Funciona como tope de seguridad, no como aforo en tiempo real.
- **Semana = semana ISO** (lunes–domingo), no configurable a "7 días móviles".
- Sin notificaciones (email de recordatorio, aviso de cupo casi lleno).
- Tests unitarios del motor de reglas y de fechas (Vitest). Falta cobertura de integración de
  los endpoints y de la UI (e2e).

## Evolución natural

### 1. Multi-comunidad (el "filón de negocio")
Convertir la app en multi-tenant para vender a varias comunidades:
- Añadir modelo `Community { id, name, slug }`.
- Añadir `communityId` a `Owner` y a `Settings` (y dejar de usar `Settings` como fila única).
- Aislar cada comunidad por `communityId` en todas las consultas (o por subdominio/slug).
- Panel de super-administración para alta de comunidades.

El código ya separa el motor de reglas de la BD, así que el cambio es sobre todo de modelo y
de "scoping" de consultas, no de lógica de negocio.

### 2. Puente hacia el control de acceso (sin entrar en hardware)
Aunque el control físico esté fuera de scope, la app puede **alimentarlo**:
- **QR / código diario por invitado**: generar un código asociado a la declaración que el
  propietario enseñe; un móvil del conserje o un lector lo valida contra la API.
- **Lista del día**: endpoint/exportación con los invitados autorizados de la jornada para que
  quien controle el acceso (persona o sistema) la consulte.
- **Webhook**: si la comunidad instala un torno con API, notificarle las autorizaciones del día.

### 3. Mejoras de producto
- Recordatorios y avisos por email.
- Histórico y estadísticas por temporada (uso de cupos, días punta).
- Gestión de incidencias (invitado que aparece sin declaración).
- App móvil / PWA instalable.
