# Reglas de negocio

Cada comunidad define sus normas de invitados. La app las modela como **cuatro topes** más
una **ventana de temporada**, todos configurables por la administración. El motor de validación
vive en [src/lib/rules.ts](../src/lib/rules.ts).

## Las normas

| Norma | Campo `Settings` | Ejemplo Abedul |
|-------|------------------|----------------|
| Aforo total de la piscina | `poolCapacity` | 45 personas |
| Máx. invitados por propietario y **día** | `maxGuestsPerDay` | 4 |
| Máx. invitados por propietario y **semana** | `maxGuestsPerWeek` | 8 |
| Máx. invitados por propietario y **temporada** | `maxGuestsPerSeason` | 10 |
| Ventana de temporada | `seasonStart` / `seasonEnd` | jun–sep |

> Configurando los topes a un valor muy alto se obtiene de facto "invitados ilimitados";
> poniéndolos a 0 se obtiene "no se permiten invitados". Así una misma app sirve para
> comunidades con políticas muy distintas.

## El motor de validación

`validateDeclaration()` recibe la fecha, el nº de invitados, las normas y los **totales ya
calculados** (no consulta la BD: eso lo hace `computeTotals()` en
[quotas.ts](../src/lib/quotas.ts)). Comprueba, en orden:

1. **GUESTS_MIN** — al menos 1 invitado.
2. **OUT_OF_SEASON** — la fecha está dentro de `[seasonStart, seasonEnd]`.
3. **DAY_LIMIT** — `invitados + ya_declarados_ese_día ≤ maxGuestsPerDay`.
4. **WEEK_LIMIT** — `invitados + ya_declarados_esa_semana ≤ maxGuestsPerWeek`.
5. **SEASON_LIMIT** — `invitados + ya_declarados_temporada ≤ maxGuestsPerSeason`.
6. **CAPACITY** — `invitados + invitados_de_toda_la_comunidad_ese_día ≤ poolCapacity`.

Devuelve `{ ok, violations[] }`. Cada incumplimiento trae un **mensaje en español** explicando
cuántos invitados quedan, que se muestra tal cual al propietario.

### Cupos restantes (vista previa)

`remainingQuotas()` calcula, para un día dado, cuántos invitados quedan en cada dimensión
(día / semana / temporada / aforo). El formulario del propietario lo usa para mostrar
**"puedes traer hasta N invitados ese día"** antes de enviar — el `N` es el mínimo de las
cuatro dimensiones. Es la respuesta directa a la petición del cliente: *"si dice que trae 5 y
solo tiene tope de 4, que le diga que no puede llevar más de 4"*.

## Notas y límites de modelado actuales

- **El aforo cuenta solo invitados declarados**, no a los propietarios presentes (la app no
  sabe quién baja a la piscina). Es una aproximación: en Abedul el aforo "nunca se cubre", así
  que sirve de tope de seguridad, no de control de aforo en tiempo real.
- La **semana es ISO (lunes–domingo)**. Si una comunidad entiende "semana" como 7 días móviles,
  habría que parametrizarlo.
- La validación vinculante ocurre **siempre en el servidor** con datos frescos; el cliente solo
  orienta. Ver [arquitectura.md](arquitectura.md).
