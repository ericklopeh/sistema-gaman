# Demo presentación — Sistema GAMAN

Guía para levantar y presentar la plataforma operativa en modo demo.

## 1. Levantar servicios

```bash
# Raíz del proyecto
cp .env.example .env
# DEMO_MODE=true, GAMAN_API_URL=http://localhost:8010

# Backend (puerto 8010)
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8010

# Frontend (puerto 3010)
cd frontend
npm install
npm run dev -- -p 3010

# Telegram — opción A: bot real
cd telegram_bot && source .venv/bin/activate && python bot.py

# Telegram — opción B: simulador web (sin token)
# Abrir http://localhost:3010/telegram-demo tras login vendedor
```

## 2. Usuarios demo

| Correo | Contraseña | Rol | Qué ve |
|--------|------------|-----|--------|
| admin@gaman.local | demo123 | ADMIN | Todo el sistema |
| sistemas@gaman.local | demo123 | SISTEMAS | Pedidos, Sistemas, Documentos, Reportes, IA |
| recepcion@gaman.local | demo123 | RECEPCION | Compulsa, Documentos, Reportes |
| compras@gaman.local | demo123 | COMPRAS | Compras, Documentos, Reportes |
| vendedor@gaman.local | demo123 | VENDEDOR | Pedidos, Telegram, IA |

Login: `http://localhost:3010/login`

## 3. Datos semilla

En **Configuración → Reiniciar demo** o:

```bash
curl "http://localhost:8010/api/demo/seed?force=true"
```

Crea 5 casos:

| Folio | Estado | Vendedor |
|-------|--------|----------|
| PED-000001 | EN_REVISION | Eliezer Chipuli |
| PED-000002 | CORRECCION_SOLICITADA | Leonardo Arévalo |
| PED-000003 | ENVIADO_A_COMPULSA | Gerardo Santana |
| PED-000004 | EN_COMPRAS | Juan Manuel |
| PED-000005 | FINALIZADO | Sergio Vázquez |

## 4. Flujo de presentación (30 min)

### Apertura (2 min)
- Login **admin** → Dashboard
- Decir: *"Plataforma unificada: captura, revisión, autorización, compulsa, compras y notificación al vendedor."*

### Dashboard (3 min)
- KPIs: capturados hoy, pendientes revisión, compulsa, compras, notificaciones
- Casos por estado y actividad reciente

### Captura vendedor (5 min)
- Login **vendedor** → `/telegram-demo`
- `/nuevo_pedido` → cliente → Mueble → escribir `foto` (x2)
- Mostrar folio y estado `PENDIENTE_REVISION`

### Sistemas (5 min)
- Login **sistemas** → `/sistemas`
- Abrir caso EN_REVISION → Revisar → Aprobar
- Mostrar generación `autorizacion.xlsx` + `sindicato.xlsx` en expediente

### Compulsa (3 min)
- Login **recepcion** → `/compulsa`
- Descargar docs → Marcar compulsado → estado EN_COMPRAS

### Compras (3 min)
- Login **compras** → `/compras`
- Proveedor Elizondo + número → Compra realizada
- Notificación Telegram (real o mock en historial)

### Módulos complementarios (5 min)
- `/documentos` — repositorio central
- `/reportes` — export CSV demo
- `/talones`, `/refinanciamientos`, `/saldos` — módulos preparados
- `/ia` — preguntas sugeridas con respuesta mock dinámica

### Cierre (4 min)
- `/configuracion` — DEMO_MODE, integraciones pendientes
- Qué sigue para producción: PostgreSQL, SharePoint, ERP, IA real

## 5. Qué decir en cada pantalla

| Pantalla | Mensaje clave |
|----------|---------------|
| Login | Acceso por rol; sin seguridad enterprise aún |
| Dashboard | Vista gerencial del pipeline comercial |
| Pedidos | Captura web + Telegram, expediente por folio |
| Sistemas | Revisión y aprobación generan Excel oficiales |
| Compulsa | Recepción valida autorización/sindicato |
| Compras | Cierre operativo + notificación vendedor |
| Documentos | Trazabilidad local + ruta SharePoint futura |
| Telegram | Canal de campo sin depender de la web |
| IA/RAG | Placeholder — conectar LLM + RAG después |
| Configuración | Arquitectura lista para producción |

## 6. Qué está en demo vs producción

| Componente | Demo | Producción |
|------------|------|------------|
| Persistencia casos | JSON local | PostgreSQL |
| Storage | LocalStorageProvider | SharePoint Graph |
| Auth | Usuarios fijos | SSO / JWT real |
| Telegram | Simulador o bot real | Bot producción |
| IA/RAG | Respuestas mock | LLM + embeddings |
| ERP / Saldos | Datos en memoria | BD refinanciamiento |
| Excel autorización | openpyxl + plantillas | Formato 100% referencia |

## 7. Checklist mañana

- [ ] Backend 8010 responde `/health`
- [ ] Frontend 3010 muestra `/login`
- [ ] Semilla demo cargada (5 casos)
- [ ] Flujo completo probado una vez
- [ ] Simulador Telegram o bot con token
- [ ] Export reportes funciona
- [ ] Expediente abre desde Pedidos

## 8. Solución de problemas

- **Sin casos:** `GET /api/demo/seed?force=true`
- **Login falla:** verificar backend en `NEXT_PUBLIC_API_URL`
- **Aprobar error fecha:** usar formato DD/MM/YYYY (ya en semilla)
- **Sin Telegram:** usar `/telegram-demo` y mock en historial de compras