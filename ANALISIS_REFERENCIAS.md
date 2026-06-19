# Análisis de Repositorios de Referencia — Sistema GAMAN

**Fecha:** 18 de junio de 2026  
**Workspace validado:** `~/GAMAN_WORKSPACE/`

## Estructura del workspace

```
~/GAMAN_WORKSPACE/
├── sistema-gaman/                  ← ÚNICO repositorio modificable
├── telegram_bot_REFERENCIA/        ← Solo lectura
├── revision_talones_REFERENCIA/    ← Solo lectura
└── formato_nuevo_REFERENCIA/       ← Solo lectura (clonado en esta sesión)
```

**Estado actual de `sistema-gaman`:** FastAPI + Next.js con APIs REST y datos demo en memoria (`demo_data.py`). PostgreSQL y SQLAlchemy están configurados pero sin modelos ni migraciones reales. `openpyxl` ya está en dependencias.

**Principio de integración:** Toda la lógica de negocio se portará **dentro de `sistema-gaman/`** sin dependencias en tiempo de ejecución hacia los repos de referencia.

---

## 1. telegram_bot_REFERENCIA

### Módulos encontrados

| Módulo | Ruta | Responsabilidad |
|--------|------|-----------------|
| Constantes de dominio | `app/domain/constants.py` | Estados, tipos de documento, checklist, mapeo visible |
| Modelos ORM | `app/models/` | `Case`, `CaseHistory`, `Document`, `OcrResult`, `AuthorizationJob` |
| Repositorios | `app/repositories/` | `case_repository`, `document_repository`, `history_repository` |
| Servicios | `app/services/` | `case_service`, `telegram_file_service`, `microsoft_graph`, `sharepoint_retry_queue` |
| Bot Telegram | `app/bot/handlers.py`, `keyboards.py` | Flujos UI, sesiones, callbacks de grupos |
| Persistencia | `app/db/`, `migrations/` | SQLAlchemy 2.0 + Alembic (3 migraciones) |
| API stub | `app/api/main.py` | `/health`, `/generar-autorizacion` (n8n) |

### Funcionalidades detectadas

#### Flujo de pedidos

1. Vendedor inicia pedido → nombre cliente → tipo (Mueble / Préstamo)
2. Se crea caso skeleton con folio numérico (`00001`, `PED-00006`)
3. Estado inicial: `Recibido` (interno) / `En pedido` (visible)
4. Subida de documentos por checklist (botones inline)
5. Validación de checklist obligatorio antes de finalizar
6. `finalize_pedido()` → `En preparación de autorización`
7. Grupo de pedidos: Aprobar / Rechazar / Corrección
8. Grupo de compulsas: OK / Pendiente / No procede / Compra realizada
9. Jobs automáticos: SLA watchdog, recordatorio compulsa, reintentos SharePoint

#### Flujo de revisión

1. Vendedor adjunta talón → caso `REVTMP-{YYYY}-{NNNN}`
2. Estado: `En revisión`
3. Admin dictamina: `Liquidez a favor` / `Sin liquidez` + evidencia Excel

#### Estados (internos)

**Revisión:** Recibido, En revisión, Corrección solicitada, Liquidez a favor, Sin liquidez, Rechazado, Cerrado

**Pedido:** Recibido, En preparación de autorización, Corrección solicitada, En compulsa, Pendiente de compulsa, Compulsa OK, Compra realizada, Cerrado, Rechazado

**Visible al vendedor:** Recibido, En revisión, Liquidez a favor, No procede, En pedido, En compulsa, Cerrado

#### Documentos

| Tipo BD | Uso |
|---------|-----|
| `pedido` | Obligatorio |
| `orden_descuento` | Obligatorio |
| `caratula_bancaria` | Solo préstamo |
| `revision_evidencia` | Revisión inicial |
| `revision_dictamen` | Dictamen admin |

- Versionado: un documento activo por `(case_id, document_type)` con soft-replace
- Almacenamiento local: `{PEDIDOS_PATH}/{SEM}/{folio cliente}/EVIDENCIAS|AUTORIZACION`
- SharePoint vía Microsoft Graph con cola JSON de reintentos

#### Historial

Tabla `case_history` (append-only): `old_status`, `new_status`, `action_source`, `action_user`, `notes`, `created_at`

Se registra en: creación de caso, transiciones de estado, carga/reemplazo de documentos, dictámenes y acciones de grupo.

#### PostgreSQL

| Tabla | Campos clave |
|-------|--------------|
| `cases` | `public_id`, `case_type`, `order_type`, `current_status`, `visible_status`, `official_folio`, `seller_telegram_chat_id`, `week_code`, `folder_path` |
| `documents` | `document_type`, `is_active`, `replaced_document_id`, `upload_status`, `sharepoint_web_url` |
| `case_history` | Audit trail por caso |
| `ocr_results` | Placeholder futuro |
| `authorization_jobs` | Placeholder futuro |

---

## 2. revision_talones_REFERENCIA

### Módulos encontrados

| Módulo | Ruta | Responsabilidad |
|--------|------|-----------------|
| App principal | `app.py` | Streamlit: revisión talón + refinanciamiento |
| Calculadora talón | `services/calculadora.py` | Liquidez, saldos 70%/100%, cuentas terminadas |
| Extractor PDF/OCR | `services/extractor_pdf.py` | RFC, percepciones, descuentos desde PDF/imagen |
| Generador Excel revisión | `services/generador_excel.py` | Llena `plantilla_revision_talon.xlsx` |
| Generador PDF | `services/generador_pdf.py` | PDF de revisión |
| Lógica refinanciamiento | `utils/refinanciamiento.py` | Cálculos, simulación, Excel/PDF/JSON |
| BD refinanciamiento | `services/refinanciamiento_db.py` | Consultas PostgreSQL (con túnel SSH opcional) |
| UI refinanciamiento | `ui/refinanciamiento_tab.py` | Flujo completo con BD |
| Plantilla | `templates/plantilla_revision_talon.xlsx` | Formato imprimible revisión |

### Funcionalidades detectadas

#### Lógica de venta posible

```python
PLAZOS_REFINANCIAMIENTO = [72, 60, 46, 34]

total_abono_nuevo = abono_ref + aumento_descuento
total_saldo_nuevo = total_abono_nuevo × plazo
VENTA_POSIBLE = total_saldo_nuevo - total_saldo_pendiente
```

- `abono_ref` = suma de `ABONO` de facturas incluidas
- Plazo **72** es el referente principal en UI
- Umbral de elegibilidad: **40% pagado** por factura (`PAGADO / VTA ≥ 0.40`)

#### Descuento nuevo

```
DESCUENTO_NUEVO = Σ(ABONO facturas incluidas) + aumento_descuento
```

- `ABONO` por factura: `VTA / plazo_venta` (default plazo 72 si no hay dato)
- `aumento_descuento` = liquidez adicional ingresada por el operador
- Es constante para todos los plazos; solo `VENTA POSIBLE` y `TOTAL SALDO NUEVO` varían por plazo

#### Mensaje formal (mensaje vendedor)

Funciones en `app.py`:

- `generar_resultado_liquidez()` — frase según liquidez, programado y cuentas terminadas
- `generar_mensaje_vendedor()` — un cliente
- `generar_mensaje_vendedor_lote()` — varios talones del mismo promotor
- `formato_moneda()` — `$X,XXX.XX`

Plantilla base:

```
Se realizó la revisión del talón correspondiente al cliente:

Cliente: {nombre}
RFC: {rfc}

Resultado de la revisión:
{resultado_liquidez}
```

Con cuentas terminadas: bloques adicionales de saldos liberados y observaciones. El mensaje se escribe en celda **B36** del Excel de revisión.

#### Generación de Excel

**Revisión de talón** (`generador_excel.py` + plantilla):

| Celda | Dato |
|-------|------|
| B3, D3 | RFC, nombre |
| C4, E4 | QNA, fecha pago |
| B6–B15 | Códigos de ingreso |
| E7, E8, E10 | Saldos 70/100 |
| B31–B35 | Promotor, cliente, liquidez |
| **B36** | Mensaje vendedor |
| A41–D47 | Bloque liquidez detallado |

Hoja adicional `CUENTAS_TERMINADAS` creada dinámicamente.

**Refinanciamiento** (`utils/refinanciamiento.py`):

- Hoja `Facturas`: 15 columnas con elegibilidad y estatus
- Hoja `Resumen Refinanciamiento`: matriz por plazos con filas destacadas (amarillo `#FFF2CC`) para VENTA POSIBLE y DESCUENTO NUEVO

#### PostgreSQL (refinanciamiento)

Tablas Django-style: `sales_sale`, `sales_saleitem`, `payments_payment`, `payments_installment`, `customers_customer`. Acceso opcional vía túnel SSH.

---

## 3. formato_nuevo_REFERENCIA

### Módulos encontrados

| Archivo | Versión | Responsabilidad |
|---------|---------|-----------------|
| `app.py` | v1 | Generación Excel básica |
| `app2.py` | v2 | Carpeta SEM + evidencias + PDF escaneado |
| `appv3.py` | v3 | Guardado seguro, F13 texto, recálculo Excel |
| `appv4.py` | v4 (actual) | Plantilla master única + corrección fórmulas |

### Plantillas Excel

| Archivo | Propósito | Recomendación |
|---------|-----------|---------------|
| `formato nuevo.xlsx` | Formulario autorización (3 hojas) | Base histórica |
| `formato_autorizaciones.xlsx` | Formato viejo + 216 plazos en Hoja2 | No usar (layout distinto) |
| `plantilla_master_autorizaciones.xlsx` | Plantilla unificada (96 plazos) | **Usar esta** |

### Layout Hoja1 — Autorización (formato nuevo)

Área útil: **A1:G18**

| Campo | Celda | Formato |
|-------|-------|---------|
| Teléfono | D1 (merge D1:E1) | texto centrado |
| Cliente | B2 (merge B2:C2) | texto |
| RFC | E2 | texto |
| Fecha | G2 | `DD/MM/YYYY` |
| Productos (×5) | A4:G8 | montos `$#,##0.00` |
| Total compra | C9:F9 | `=SUM(...)` |
| Observaciones | A11 (merge A11:B14) | texto |
| Vendedor | B15 | texto |
| Folio | D11 | texto |
| Semana | F11 | entero |
| Monto Total | D12 (merge D12:D14) | money |
| Inicio | F13 | texto `MM-AAAA`, fmt `@` |
| Plazo | F14 | entero (semanas) |
| **NO tocar** | E13, G13 | fórmulas calculadas |

### Fórmulas críticas

| Celda | Fórmula | Significado |
|-------|---------|-------------|
| E13 | `=D12/F14` | Pago semanal (label dice "DESCUENTO") |
| G13 | `INDEX/MATCH` en Hoja2 | Fecha FINAL del plan |
| C9:F9 | `=SUM(C4:C8)` etc. | Totales por columna |

**G13 corregida (appv4):**

```excel
=INDEX(Hoja2!A2:CV40000,
       MATCH(Hoja1!F13,Hoja2!A2:A40000,0),
       MATCH(Hoja1!F14,Hoja2!A1:CV1,0))
```

### Hoja2 — Tabla de calendario (96 plazos)

- Plazos 1–96 en **fila 1** (cols A–CV)
- INICIO en col A desde fila 2 (`MM-AAAA`)
- Intersección inicio + plazo → fecha FINAL

### Estilos

- Fuente global: **Aptos Narrow 12** (labels bold)
- Sin colores de fondo en Hoja1
- Bordes: `medium` exterior, `thin` interno en tabla productos
- Formato contable Excel en plantilla: `_-"$"* #,##0.00_-`

### Validaciones (appv4)

- `parse_money` — `$1,234.50` → float
- `validar_inicio_mm_aaaa` — regex `^(0[1-9]|1[0-2])-\d{4}$`
- `validar_fecha_ddmmyyyy` — `%d/%m/%Y`
- Tipos venta: Nueva, Paralela, Reactivada, Reestructurada

---

## 4. Qué se migrará primero

Orden por dependencias y valor de negocio:

### Fase 1 — Núcleo de persistencia y casos (telegram_bot)

**Prioridad: CRÍTICA** — Todo lo demás depende de tener casos reales en BD.

| Componente | Origen | Destino en sistema-gaman |
|------------|--------|--------------------------|
| `domain/constants.py` | telegram_bot | `backend/app/domain/constants.py` |
| Modelos `Case`, `Document`, `CaseHistory` | telegram_bot | `backend/app/models/` |
| Migraciones Alembic (3 versiones) | telegram_bot | `backend/migrations/` |
| `CaseService` | telegram_bot | `backend/app/services/case_service.py` |
| Repositories | telegram_bot | `backend/app/repositories/` |
| Reemplazar `demo_data.py` en APIs | — | `cases`, `pedidos`, `dashboard` |

**Entregable:** Casos de pedido y revisión con estados, documentos versionados e historial en PostgreSQL.

### Fase 2 — Lógica de refinanciamiento (revision_talones)

**Prioridad: ALTA** — El frontend ya muestra `venta_posible` y `descuento_nuevo` como datos mock.

| Componente | Origen | Destino en sistema-gaman |
|------------|--------|--------------------------|
| `calcular_facturas_refinanciamiento` | revision_talones | `backend/app/services/refinanciamiento.py` |
| `calcular_resumen_refinanciamiento` | revision_talones | mismo |
| `PLAZOS_REFINANCIAMIENTO` | revision_talones | `backend/app/domain/constants.py` |
| `generar_excel_refinanciamiento` | revision_talones | `backend/app/services/refinanciamiento_excel.py` |
| `refinanciamiento_db.py` | revision_talones | `backend/app/repositories/refinanciamiento_repository.py` |

**Entregable:** `POST /api/refinanciamientos/calcular` con simulación real por plazos.

### Fase 3 — Revisión de talones y mensaje formal (revision_talones)

**Prioridad: ALTA**

| Componente | Origen | Destino en sistema-gaman |
|------------|--------|--------------------------|
| `calculadora.py` | revision_talones | `backend/app/services/talon_calculator.py` |
| `generar_mensaje_vendedor` | revision_talones | `backend/app/services/talon_mensaje.py` |
| `generador_excel.py` | revision_talones | `backend/app/services/talon_excel.py` |
| `plantilla_revision_talon.xlsx` | revision_talones | `backend/storage/templates/` |
| `extractor_pdf.py` | revision_talones | `backend/app/services/talon_extractor.py` |

**Entregable:** Revisión de talón con mensaje formal y Excel desde API.

### Fase 4 — Autorizaciones Excel (formato_nuevo)

**Prioridad: MEDIA** — Depende de casos (Fase 1) y plantilla master.

| Componente | Origen | Destino en sistema-gaman |
|------------|--------|--------------------------|
| Helpers de `appv4.py` | formato_nuevo | `backend/app/services/autorizaciones_excel.py` |
| `plantilla_master_autorizaciones.xlsx` | formato_nuevo | `backend/storage/templates/` |
| Schema Pydantic | nuevo | `backend/app/schemas/autorizacion.py` |
| Tabla `authorization_jobs` | telegram_bot | `backend/app/models/authorization_job.py` |

**Entregable:** `POST /api/autorizaciones` genera Excel con fórmulas corregidas.

### Fase 5 — Integraciones externas

**Prioridad: MEDIA-BAJA**

| Componente | Origen | Destino en sistema-gaman |
|------------|--------|--------------------------|
| `microsoft_graph.py` | telegram_bot | `backend/app/services/sharepoint.py` |
| `sharepoint_retry_queue.py` | telegram_bot | `backend/app/services/upload_retry.py` |
| `graph_storage.py` | revision_talones | unificar con SharePoint |
| Bot Telegram | telegram_bot | `bot/` como cliente HTTP del backend |

### Fase 6 — OCR, PDF y IA

**Prioridad: BAJA (futuro)**

- `ocr_service.py` (stub) → módulo IA/RAG
- `generador_pdf.py` → PDF revisión y refinanciamiento
- `crear_pdf_escaneado` (formato_nuevo) → evidencias PDF

---

## 5. Dependencias

### Ya presentes en sistema-gaman

```
fastapi, uvicorn, sqlalchemy, psycopg[binary], pydantic-settings,
python-dotenv, alembic, openpyxl
```

### A agregar por fase

| Fase | Paquete | Uso |
|------|---------|-----|
| 1 | — | Sin dependencias nuevas |
| 2 | `pandas` | DataFrames refinanciamiento |
| 3 | `pymupdf`, `pytesseract`, `pillow` | Extracción PDF/OCR talones |
| 3 | `reportlab` | PDF revisión |
| 4 | `pillow`, `reportlab` | PDF evidencias escaneadas |
| 5 | `requests`, `msal` | Microsoft Graph / SharePoint |
| 5 | `python-telegram-bot[job-queue]` | Bot Telegram |
| 2 (opcional) | `sshtunnel`, `paramiko` | Túnel SSH a BD remota |

### Dependencias de sistema

- `tesseract-ocr`, `tesseract-ocr-spa` (OCR talones)

### Mapeo de estados (resolución requerida)

| Referencia (español) | sistema-gaman (slug) |
|----------------------|----------------------|
| En compulsa | `en_compulsa` |
| En preparación de autorización | `pendiente_documentos` / `en_autorizacion` |
| Compra realizada | `autorizado` / `cerrado` |
| Liquidez a favor | `liquidez_favor` |
| Sin liquidez | `sin_liquidez` |

Se necesita una capa de mapeo en la API entre estados internos y slugs del frontend.

### Diferencias de folios a unificar

| Tipo | Referencia | sistema-gaman (demo) |
|------|------------|----------------------|
| Pedido | `PED-00006` / `00006` | `PED-2026-0087` |
| Revisión | `REVTMP-2026-0010` | `REV-2026-0142` |

---

## 6. Roadmap de integración

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ROADMAP SISTEMA GAMAN                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FASE 1 ─ Persistencia y casos                                         │
│  ├── Modelos ORM + migraciones Alembic                                 │
│  ├── CaseService + repositories                                        │
│  ├── API casos/pedidos con datos reales                                │
│  └── Mapeo estados → frontend                                          │
│           │                                                             │
│           ▼                                                             │
│  FASE 2 ─ Refinanciamiento                                             │
│  ├── Lógica venta posible + descuento nuevo                            │
│  ├── Simulación por plazos [72, 60, 46, 34]                            │
│  ├── Conexión BD facturas (opcional SSH)                               │
│  └── Excel refinanciamiento                                            │
│           │                                                             │
│           ▼                                                             │
│  FASE 3 ─ Revisión de talones                                          │
│  ├── Calculadora liquidez (70%/100%)                                   │
│  ├── Mensaje formal vendedor                                           │
│  ├── Excel revisión (plantilla)                                        │
│  └── Extractor PDF/OCR                                                 │
│           │                                                             │
│           ▼                                                             │
│  FASE 4 ─ Autorizaciones                                               │
│  ├── Servicio Excel (appv4 → API)                                      │
│  ├── Plantilla master en storage/templates                             │
│  ├── Pantalla frontend /autorizaciones                                 │
│  └── Vincular con casos de pedido                                      │
│           │                                                             │
│           ▼                                                             │
│  FASE 5 ─ Integraciones                                                │
│  ├── SharePoint / OneDrive                                             │
│  ├── Bot Telegram → HTTP backend                                       │
│  └── Cola reintentos uploads                                           │
│           │                                                             │
│           ▼                                                             │
│  FASE 6 ─ OCR, PDF, IA/RAG                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Endpoints objetivo por fase

**Fase 1:**
```
GET/POST  /api/cases
PATCH     /api/cases/{id}/status
GET       /api/cases/{id}/history
GET       /api/cases/{id}/documents
POST      /api/cases/{id}/documents
GET       /api/pedidos
```

**Fase 2:**
```
POST  /api/refinanciamientos/calcular
POST  /api/refinanciamientos/export/excel
GET   /api/refinanciamientos/clientes?q=
GET   /api/refinanciamientos/clientes/{id}/facturas
```

**Fase 3:**
```
POST  /api/talones/revision/calcular
POST  /api/talones/revision/mensaje
POST  /api/talones/revision/export/excel
POST  /api/talones/extract
```

**Fase 4:**
```
POST  /api/autorizaciones
GET   /api/autorizaciones
GET   /api/autorizaciones/{id}/download
POST  /api/autorizaciones/{id}/evidencias
```

### Estructura de archivos sugerida en sistema-gaman

```
backend/
├── app/
│   ├── domain/
│   │   └── constants.py          # Estados, plazos, tipos doc (Fase 1)
│   ├── models/
│   │   ├── case.py
│   │   ├── document.py
│   │   ├── case_history.py
│   │   └── authorization_job.py
│   ├── repositories/
│   │   ├── case_repository.py
│   │   ├── document_repository.py
│   │   ├── history_repository.py
│   │   └── refinanciamiento_repository.py
│   ├── services/
│   │   ├── case_service.py
│   │   ├── refinanciamiento.py
│   │   ├── refinanciamiento_excel.py
│   │   ├── talon_calculator.py
│   │   ├── talon_mensaje.py
│   │   ├── talon_excel.py
│   │   ├── talon_extractor.py
│   │   ├── autorizaciones_excel.py
│   │   └── sharepoint.py
│   ├── schemas/
│   │   ├── case.py
│   │   ├── refinanciamiento.py
│   │   └── autorizacion.py
│   └── api/
│       ├── cases.py
│       ├── pedidos.py
│       ├── refinanciamientos.py
│       ├── talones.py
│       └── autorizaciones.py
├── migrations/
└── storage/
    ├── templates/
    │   ├── plantilla_master_autorizaciones.xlsx
    │   └── plantilla_revision_talon.xlsx
    ├── uploads/
    └── generated/
```

### Riesgos identificados

1. **External links en plantillas Excel:** Siempre ejecutar `limpiar_external_links` + `arreglar_formula_final` al generar autorizaciones.
2. **F13 como texto:** Si `inicio` se guarda como fecha, `MATCH` en Hoja2 falla.
3. **OpenPyXL no calcula fórmulas:** Activar `fullCalcOnLoad=True`; Excel recalcula al abrir.
4. **Dos layouts Hoja2:** Usar solo `plantilla_master` (96 plazos, fila 1); no mezclar con `formato_autorizaciones`.
5. **Bot monolítico:** Migrar a arquitectura bot-delgado → HTTP → FastAPI.
6. **Estados inconsistentes:** Definir capa de mapeo antes de conectar frontend.

---

## 7. Resumen ejecutivo (actualizado v0.2.0)

| Repositorio | Pieza crítica | Estado en sistema-gaman |
|-------------|---------------|-------------------------|
| telegram_bot | `CaseService`, checklist, estados, Graph | **Portado** — `CaseService` + `StorageProvider` + flujo web |
| revision_talones | Cálculo talón, mensaje, refinanciamiento | **Portado** — `talon_*`, `refinanciamiento_calc` |
| formato_nuevo | `appv4.py` + plantillas Excel | **Portado** — `autorizaciones_excel`, `sindicato_excel` |

### Implementado en v0.2.0

- Flujo pedido completo: CAPTURADO → … → FINALIZADO
- Autorización + sindicato **simultáneos al aprobar** (no post-compulsa)
- Pantallas: Pedidos, Sistemas, Compulsa, Compras, Dashboard
- `StorageProvider` (Local + SharePoint stub)
- Documentación: ver `ARQUITECTURA_GAMAN.md`, `FLUJO_OPERATIVO_GAMAN.md`, `MODELO_DATOS_GAMAN.md`, `INTEGRACION_SHAREPOINT.md`, `ROADMAP_GAMAN.md`

### Pendiente

- PostgreSQL (modelos SQLAlchemy + Alembic desde telegram_bot)
- Microsoft Graph en producción
- Bot Telegram como cliente HTTP delgado

Los tres repos de referencia **no se tocan** y **no se importan en runtime**.