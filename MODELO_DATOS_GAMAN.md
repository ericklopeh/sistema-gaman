# Modelo de Datos GAMAN

## Caso (pedido)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int | PK |
| `public_id` | string | `PED-000001` |
| `case_type` | string | `pedido` |
| `order_type` | string | `mueble` \| `dinero` |
| `cliente` | string | Nombre cliente |
| `official_folio` | string | `000001` (6 dígitos) |
| `estado` | string | Estado oficial (ver abajo) |
| `vendedor` | string | Nombre vendedor |
| `seller_telegram_chat_id` | int? | Para notificaciones |
| `semana` | string | `SEM_25` |
| `folder_path` | string | Ruta carpeta documental |
| `documentos` | array | Metadata de archivos |
| `historial` | array | Audit trail |
| `autorizacion` | object? | Datos usados al generar Excel |
| `compra` | object? | Datos de compra |
| `notificaciones` | array? | Mensajes Telegram enviados |
| `storage_provider` | string | `local` \| `sharepoint` |

## Estados oficiales

```
CAPTURADO
PENDIENTE_REVISION
EN_REVISION
CORRECCION_SOLICITADA
APROBADO
RECHAZADO
AUTORIZACION_GENERADA
SINDICATO_GENERADO
ENVIADO_A_COMPULSA
COMPULSADO
EN_COMPRAS
COMPRADO
NOTIFICADO_VENDEDOR
FINALIZADO
```

## Documento

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tipo` | string | `pedido`, `orden_descuento`, `caratula_bancaria`, `autorizacion`, `sindicato` |
| `filename` | string | Nombre en carpeta |
| `local_path` | string | Ruta absoluta |
| `mirror_path` | string? | Espejo SharePoint local |
| `sharepoint_url` | string? | URL remota |
| `upload_status` | string | `UPLOADED` \| `PENDING_UPLOAD` |

## Historial (case_history)

| Campo | Tipo |
|-------|------|
| `old_status` | string? |
| `new_status` | string |
| `action_user` | string |
| `action_source` | string (`sistema`, `telegram`, `web`) |
| `notes` | string |
| `timestamp` | ISO datetime |

## Compra

| Campo | Tipo |
|-------|------|
| `proveedor` | `Elizondo` \| `Otro` |
| `numero_pedido` | string? (Elizondo) |
| `nombre_proveedor` | string? (Otro) |
| `observaciones` | string |
| `fecha` | ISO datetime |

## Mapeo desde telegram_bot_REFERENCIA

| telegram_bot | GAMAN |
|--------------|-------|
| `ST_PED_RECIBIDO` | `CAPTURADO` |
| `ST_PED_PREP_AUT` | `PENDIENTE_REVISION` |
| `ST_PED_EN_COMPULSA` | `ENVIADO_A_COMPULSA` |
| `ST_PED_COMPULSA_OK` | `COMPULSADO` |
| `ST_PED_COMPRA` | `COMPRADO` |
| `ORDER_TYPE_PRESTAMO` | `dinero` |
| `DOC_CARATULA_BANCARIA` | `caratula_bancaria` |

## Persistencia actual vs futura

| Actual (demo) | Futuro (producción) |
|---------------|---------------------|
| `storage/cases/index.json` | PostgreSQL `cases` |
| Archivos en `storage/uploads/` | SharePoint vía Graph API |
| `historial.json` por carpeta | Tabla `case_history` |