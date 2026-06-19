# Bot Telegram GAMAN

Cliente HTTP delgado para captura y consulta. **Toda la lógica de negocio vive en GAMAN** (backend FastAPI).

## 1. Crear bot en BotFather

1. Abre Telegram y busca [@BotFather](https://t.me/BotFather)
2. Envía `/newbot`
3. Elige nombre: `Sistema GAMAN`
4. Elige username: `gaman_sistema_bot` (o el que BotFather permita)
5. Copia el **token** que te entrega

## 2. Configurar `.env`

En la raíz del proyecto `sistema-gaman/.env`:

```env
TELEGRAM_BOT_TOKEN=tu_token_de_botfather
GAMAN_API_URL=http://localhost:8010
DEMO_MODE=true

OPERATING_HOURS_ENABLED=true
OPERATING_HOURS_START=09:00
OPERATING_HOURS_END=18:00
OPERATING_DAYS=MON,TUE,WED,THU,FRI
```

El **mismo token** lo usa el backend para notificar al vendedor cuando Compras marca `COMPRADO`.

## 3. Levantar backend (8010)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8010
```

Verificar: `curl http://localhost:8010/health`

## 4. Levantar frontend (3010)

```bash
cd frontend
npm install
npm run dev -- -p 3010
```

Abrir: `http://localhost:3010/login`

## 5. Levantar bot Telegram

```bash
cd telegram_bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python bot.py
```

Debe mostrar: `Bot GAMAN iniciado — polling activo`

## 6. Probar `/start`

1. Busca tu bot en Telegram por el username de BotFather
2. Envía `/start`
3. Debes ver bienvenida + menú con botones:
   - 📦 Nuevo pedido
   - 📋 Mis pedidos
   - 📈 Mis ventas de hoy
   - 🔍 Consultar estatus
   - Horario Lun–Vie 09:00–18:00

## 7. Probar `/nuevo_pedido`

**Solo dentro de horario operativo** (Lun–Vie 09:00–18:00 hora Monterrey).

1. `/nuevo_pedido` o botón 📦 Nuevo pedido
2. Nombre del cliente
3. Tipo: 🛋️ Mueble o 💵 Dinero
4. Fotos según tipo:
   - **Mueble:** orden descuento → pedido
   - **Dinero:** pedido → orden descuento → carátula banco
5. Respuesta:

```
✅ Pedido registrado
Folio: PED-XXXXXX
Cliente: ...
Estado: PENDIENTE_REVISION
```

6. Ver pedido en GAMAN Web → `/sistemas`

Fuera de horario: mensaje ⛔ con horario permitido. Consultas siguen activas.

## Comandos

| Comando | API GAMAN |
|---------|-----------|
| `/start` | — |
| `/nuevo_pedido` | `POST /api/pedidos/from-telegram` + documentos |
| `/mis_pedidos` | `GET /api/vendedores/{id}/pedidos` |
| `/mis_ventas_hoy` | `GET /api/vendedores/{id}/ventas-hoy` |
| `/estatus` | `GET /api/vendedores/{id}/estatus` |
| `/mis_pendientes` | `GET /api/vendedores/{id}/pendientes` |
| `/cancel` | Cancela captura en curso |

## Notificaciones (Compras → Vendedor)

Al marcar compra en `/compras`, el backend envía:

```
✅ Compra realizada
Folio / Cliente / Proveedor / Pedido / Estado
```

Vía `TelegramNotificationService`. Sin token válido → mock en historial del caso.

API manual: `POST /api/notificaciones/telegram`

## Demo E2E mañana

1. Backend 8010 + Frontend 3010 + `python bot.py`
2. Telegram → crear pedido
3. Web `/sistemas` → aprobar
4. `/compulsa` → compulsar
5. `/compras` → compra realizada
6. Telegram → notificación al vendedor + `/estatus`

## Estructura

```
telegram_bot/
├── bot.py
├── config.py
├── requirements.txt
├── handlers/
│   ├── start.py
│   ├── nuevo_pedido.py
│   ├── consultas.py
│   └── menu.py
└── services/
    ├── gaman_api.py
    ├── temp_files.py
    └── constants.py
```