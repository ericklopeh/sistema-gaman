# Manual Sistemas — Demo GAMAN

## Acceso
- `sistemas@gaman.local` / `demo123`

## Pantalla `/sistemas`
Casos en: `PENDIENTE_REVISION`, `EN_REVISION`, `CORRECCION_SOLICITADA`.

## Acciones
1. **Revisar** — pasa a `EN_REVISION`
2. **Aprobar** — genera `autorizacion.xlsx` y `sindicato.xlsx`, envía a compulsa
3. **Solicitar corrección** — devuelve al vendedor
4. **Rechazar** — cierra el caso

## Expediente
Desde `/pedidos` o `/expediente/{folio}`: documentos, historial, comentarios.

## Nota demo
Plantillas Excel usan openpyxl con datos del caso. TODO: conectar formato exacto `formato_nuevo_REFERENCIA`.