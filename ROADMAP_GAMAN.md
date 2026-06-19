# Roadmap Sistema GAMAN

## Completado (v0.3.0 — Demo presentación)

- [x] DEMO_MODE + semilla 5 casos multi-estado
- [x] Login demo por rol (`/login`)
- [x] Dashboard KPIs ampliado
- [x] Expediente caso (`/expediente/{folio}`)
- [x] Documentos (`/documentos`) y Reportes (`/reportes`)
- [x] Simulador Telegram (`/telegram-demo`)
- [x] APIs: auth, demo/seed, casos, documentos, reportes
- [x] Manuales por rol + DEMO_PRESENTACION.md

## Completado (v0.2.0)

- [x] StorageProvider (Local + SharePoint stub)
- [x] CaseService con estados oficiales y transiciones
- [x] Checklist documentos Mueble / Dinero
- [x] Generación simultánea autorización + sindicato al aprobar
- [x] Pantallas: Pedidos, Sistemas, Compulsa, Compras, Dashboard
- [x] Módulo talones (revisión, mensaje, Excel)
- [x] Estructura documental por caso + historial.json
- [x] Notificación vendedor (demo registrada)
- [x] Caso semilla para demo inmediata
- [x] Bot Telegram delgado (`telegram_bot/`) + endpoints API vendedor
- [x] Notificación compra → Telegram (real o mock en historial)

## Fase 1 — Persistencia PostgreSQL

- [ ] Portar modelos `Case`, `Document`, `CaseHistory` de telegram_bot
- [ ] Migraciones Alembic
- [ ] Reemplazar `case_repository.py` JSON por SQLAlchemy
- [ ] Repositories: case, document, history

## Fase 2 — SharePoint producción

- [ ] Portar `microsoft_graph.py` completo
- [ ] Cola reintentos (`sharepoint_retry_queue`)
- [ ] `MS_GRAPH_ENABLED=true` en producción
- [ ] Tracking `upload_status` por documento

## Fase 3 — Bot Telegram delgado ✅

- [x] `telegram_bot/` como cliente HTTP de FastAPI
- [x] Captura pedido → `POST /api/pedidos/from-telegram` + documentos
- [x] Consultas vendedor → `GET /api/vendedores/{telegram_id}/...`
- [x] Notificaciones push desde GAMAN → Telegram API (mock sin token)
- [ ] Grupos operativos pedidos/compulsa (futuro, como telegram_bot_REFERENCIA)

## Fase 4 — Integraciones adicionales

- [ ] PostgreSQL refinanciamiento (revision_talones_db)
- [ ] OCR talones (extractor_pdf)
- [ ] SLA watchdog y recordatorios
- [ ] Módulo IA/RAG

## Fase 5 — Producción

- [ ] Autenticación y roles (vendedor, sistemas, recepción, compras)
- [ ] Auditoría completa
- [ ] Monitoreo y alertas