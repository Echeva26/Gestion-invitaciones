# Documentación · Abedul Piscina

Índice de la documentación del proyecto. Para el arranque rápido y el resumen, ver el
[CLAUDE.md](../CLAUDE.md) en la raíz.

## El problema

Las comunidades de propietarios tienen un aforo limitado en la piscina y normas sobre
invitados, pero **no disponen de vigilante en la puerta**. El socorrista no controla accesos.
Sin un sistema, traer invitados se convierte en un descontrol: gente que no paga la comunidad
disfrutando de la piscina, y nadie capaz de verificar si un invitado estaba autorizado.

Esta app resuelve la parte de **gestión y autorización** de invitados:

1. El propietario **declara** con antelación cuántos invitados traerá y qué día.
2. El sistema **aplica las normas** automáticamente (cupos diario/semanal/temporada + aforo)
   y rechaza lo que las incumpla, indicando el motivo.
3. Queda un **registro consultable** por la administración de la ocupación prevista.

> El **control físico** del acceso (torno, lector, vigilante) queda **fuera de scope** —
> es un problema de hardware que cualquier empresa de control de accesos cubre. Ver
> [roadmap.md](roadmap.md) para cómo esta app podría alimentar ese control en el futuro.

## Documentos

- [arquitectura.md](arquitectura.md) — Visión técnica, carpetas, flujo de datos.
- [modelo-datos.md](modelo-datos.md) — Entidades y esquema de base de datos.
- [reglas-negocio.md](reglas-negocio.md) — Las normas y cómo se validan.
- [api.md](api.md) — Endpoints HTTP.
- [autenticacion.md](autenticacion.md) — Acceso con enlaces mágicos y roles.
- [despliegue.md](despliegue.md) — Despliegue, variables de entorno y configuración de correo.
- [roadmap.md](roadmap.md) — Limitaciones conocidas y evolución (multi-comunidad, accesos).
