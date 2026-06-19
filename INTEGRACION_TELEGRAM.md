# Integración Telegram — Sistema GAMAN

## Arquitectura
- **Bot delgado** (`telegram_bot/`) — cliente HTTP, sin lógica de negocio
- **Backend** — crea casos, almacena documentos, notifica en compras

## Variables
```env
TELEGRAM_BOT_TOKEN=
GAMAN_API_URL=http://localhost:8010
```

## API consumida
| Método | Ruta |
|--------|------|
| POST | `/api/pedidos/from-telegram` |
| POST | `/api/pedidos/{folio}/documentos` |
| GET | `/api/vendedores/{id}/pedidos` |
| GET | `/api/vendedores/{id}/pendientes` |
| GET | `/api/vendedores/{id}/ventas-hoy` |
| GET | `/api/vendedores/{id}/estatus` |

## Simulador web (sin token)
`/telegram-demo` — misma experiencia para presentación.

## Notificaciones salientes
`telegram_notify.py` en compras → `sendMessage` o registro mock en `notificaciones[]` del caso.

## Horario operativo

Captura (`/nuevo_pedido`) bloqueada fuera de Lun–Vie 09:00–18:00 para vendedores.
Consultas siempre disponibles. Config: `OPERATING_DAYS=MON,TUE,WED,THU,FRI`.

## Notificaciones

`TelegramNotificationService` — `POST /api/notificaciones/telegram` o automático en compras.

## Producción
- Token único para bot + notificaciones backend
- Mapear `seller_telegram_chat_id` en cada pedido
- Grupos operativos (pedidos/compulsa) — fase futura