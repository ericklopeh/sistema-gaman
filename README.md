# Sistema GAMAN

Plataforma web para automatizar procesos comerciales de una mueblería.

**Demo presentación:** ver [DEMO_PRESENTACION.md](DEMO_PRESENTACION.md) — login, flujo paso a paso y checklist.

## Objetivo

Sistema GAMAN centraliza en una sola plataforma:

- Revisión de talones
- Generación de Excel/PDF
- Pedidos
- Autorizaciones
- Documentos
- Historial de estados
- Compulsa
- Refinanciamientos
- Saldos
- Reportes
- Bot de Telegram como canal operativo
- Futuro módulo IA/RAG

## Arquitectura

```txt
Sistema GAMAN
├── frontend/   Next.js + TypeScript + TailwindCSS
├── backend/    FastAPI + PostgreSQL + SQLAlchemy
├── telegram_bot/  Bot delgado (captura y consulta vía API)
├── storage/    Archivos generados y cargados
└── docs/       Documentación técnica
```

## Modo demo

```env
DEMO_MODE=true
```

- Usuarios demo en `/login` (contraseña `demo123`)
- Datos semilla: `GET /api/demo/seed?force=true`
- LocalStorageProvider, IA mock, Telegram simulador o bot real

## Requisitos

- Node.js 20+ y npm
- Python 3.11+ (backend + bot)
- Backend activo en el puerto 8010

## Frontend

El frontend corre en el puerto **3010** (el 3000 está reservado para Grafana).

### Configuración

Copia las variables de entorno:

```bash
cp frontend/.env.example frontend/.env.local
```

Asegúrate de que `NEXT_PUBLIC_API_URL` apunte al backend:

```env
NEXT_PUBLIC_API_URL=http://192.168.68.123:8010
```

### Desarrollo local

```bash
cd frontend
npm install
npm run dev -- -p 3010
```

Abre en el navegador:

```
http://192.168.68.123:3010
```

### Producción

```bash
cd frontend
npm install
npm run build
npm run start
```

### Pantallas disponibles

| Ruta | Módulo |
|------|--------|
| `/` | Dashboard |
| `/talones` | Revisión de talones |
| `/pedidos` | Pedidos y compulsa |
| `/refinanciamientos` | Refinanciamientos |
| `/saldos` | Conciliación de saldos |
| `/ia` | Consultas IA / RAG |
| `/reportes` | Reportes (próximamente) |
| `/configuracion` | Configuración |

## Bot Telegram

Bot delgado en `telegram_bot/` — consume la API HTTP de GAMAN (no modifica flujos de Sistemas/Compulsa/Compras).

Variables en `.env` (raíz del proyecto):

```env
TELEGRAM_BOT_TOKEN=tu_token
GAMAN_API_URL=http://localhost:8010
```

```bash
cd telegram_bot
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python bot.py
```

Comandos: `/start`, `/nuevo_pedido`, `/mis_pedidos`, `/mis_ventas_hoy`, `/estatus`.

Ver [telegram_bot/README.md](telegram_bot/README.md) para el flujo completo y demo E2E.

## Docker Compose

Para levantar todos los servicios incluyendo el frontend:

```bash
docker compose up -d --build
```

El frontend queda expuesto en `http://localhost:3010`.