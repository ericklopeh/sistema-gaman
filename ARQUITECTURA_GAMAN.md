# Arquitectura Sistema GAMAN (DEMO_MODE)

Modo demo: JSON local, auth simulada, IA mock, Telegram simulador/bot delgado. Arquitectura preparada para PostgreSQL, SharePoint y ERP.

Sistema GAMAN

**Versión:** 0.2.0 · Junio 2026

## Principio rector

Toda la lógica de negocio vive en **GAMAN**. Telegram es canal delgado (captura, consulta, notificaciones). Los repos de referencia (`telegram_bot_REFERENCIA`, `revision_talones_REFERENCIA`, `formato_nuevo_REFERENCIA`) son solo fuente de migración, sin dependencia en runtime.

## Capas

```
┌─────────────────────────────────────────────────────────────┐
│  Canales                                                    │
│  ├── Web (Next.js :3010)                                    │
│  └── Telegram Bot (futuro — cliente HTTP de GAMAN)          │
├─────────────────────────────────────────────────────────────┤
│  API FastAPI (:8010)                                        │
│  ├── /api/pedidos      Captura                               │
│  ├── /api/sistemas     Revisión y aprobación                 │
│  ├── /api/compulsa     Compulsa                               │
│  ├── /api/compras      Compra y notificación                  │
│  ├── /api/cases        Detalle, historial, descargas        │
│  ├── /api/talones      Revisión talones (Fase 2/3)          │
│  └── /api/dashboard    KPIs operativos                        │
├─────────────────────────────────────────────────────────────┤
│  Servicios de dominio                                       │
│  ├── CaseService         Máquina de estados + documentos    │
│  ├── autorizaciones_excel  formato_nuevo (appv4)            │
│  ├── sindicato_excel       formato_autorizaciones           │
│  └── talon_*               revision_talones                 │
├─────────────────────────────────────────────────────────────┤
│  StorageProvider (abstracción)                              │
│  ├── LocalStorageProvider      (activo en demo)             │
│  └── SharePointStorageProvider (preparado — Graph API)      │
├─────────────────────────────────────────────────────────────┤
│  Persistencia                                               │
│  ├── JSON (demo) — storage/cases/index.json                 │
│  └── PostgreSQL (futuro) — modelos de telegram_bot          │
└─────────────────────────────────────────────────────────────┘
```

## Estructura documental por caso

```
storage/uploads/SEM_25/
└── FOLIO_000001_JUAN_PEREZ_GARCIA/
    ├── pedido.jpg
    ├── orden_descuento.jpg
    ├── caratula_banco.jpg      (solo tipo dinero)
    ├── autorizacion.xlsx       (al aprobar — simultáneo)
    ├── sindicato.xlsx          (al aprobar — simultáneo)
    └── historial.json
```

Espejo SharePoint (preparado):

```
storage/sharepoint_mirror/SEM_25/{vendedor}/{CLIENTE}/03_AUTORIZACIONES/
```

## Módulos backend

| Ruta | Responsabilidad |
|------|-----------------|
| `app/domain/constants.py` | Estados, documentos, checklist, transiciones |
| `app/services/case_service.py` | Flujo pedido completo |
| `app/storage/provider.py` | Interfaz StorageProvider |
| `app/storage/local_provider.py` | Almacenamiento local |
| `app/storage/sharepoint_provider.py` | Stub Graph + delegación local |
| `app/repositories/case_repository.py` | Persistencia casos (JSON) |

## Frontend

| Pantalla | Rol operativo |
|----------|---------------|
| `/pedidos` | Captura pedido (Mueble / Dinero) |
| `/sistemas` | Revisión, aprobación, generación auth+sindicato |
| `/compulsa` | Ver documentos, marcar compulsado |
| `/compras` | Registrar compra, notificar vendedor |
| `/talones` | Revisión talones (módulo paralelo) |
| `/` | Dashboard KPIs |