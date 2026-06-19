# Manual vendedor — Demo GAMAN

## Acceso
- `vendedor@gaman.local` / `demo123`
- Rol: **VENDEDOR**

## Canales de captura
1. **Telegram** — `/telegram-demo` (simulador) o bot real `telegram_bot/`
2. **Web** — `/pedidos` → Nuevo pedido

## Comandos Telegram
- `/nuevo_pedido` — Cliente → Mueble/Dinero → fotos
- `/mis_pedidos` — Lista de pedidos
- `/mis_pendientes` — Casos activos
- `/mis_ventas_hoy` — Ventas del día
- `/estatus` — Resumen por estado

## Documentos requeridos
| Tipo | Orden |
|------|-------|
| Mueble | Orden descuento → Pedido |
| Dinero | Pedido → Orden descuento → Carátula banco |

## Horario operativo

Captura de pedidos (web y Telegram) solo **Lunes a Viernes 09:00–18:00**.

Fuera de horario puede consultar: `/mis_pedidos`, `/mis_pendientes`, `/estatus`, `/mis_ventas_hoy`, expedientes e historial.

ADMIN y SISTEMAS están exentos del horario.

## Qué NO hace el vendedor en GAMAN
Revisión, aprobación, autorización, compulsa y compra — las realizan otros roles en la web.