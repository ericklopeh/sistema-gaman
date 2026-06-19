# Integración SharePoint — Microsoft Graph

> **Demo:** `STORAGE_PROVIDER=local` — rutas SharePoint se muestran como `sharepoint_path` en expediente/documentos. Conectar Graph API en producción (`MS_GRAPH_ENABLED=true`).

Basado en `telegram_bot_REFERENCIA/app/services/microsoft_graph.py`.

## Principio

SharePoint es el **repositorio oficial** de documentos. El servidor local es staging/demo. La capa `StorageProvider` abstrae el destino sin cambiar `CaseService`.

## Configuración

```env
STORAGE_PROVIDER=local          # local | sharepoint
MS_GRAPH_ENABLED=false          # true cuando Graph esté listo
MS_ROOT_FOLDER=GAMAN
MS_TENANT_ID=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_SITE_ID=
MS_DRIVE_ID=
```

## Estructura de rutas SharePoint

```
{MS_ROOT_FOLDER}/{semana}/{vendedor}/{CLIENTE_UPPER}/{subcarpeta}/{archivo}
```

Subcarpetas (telegram_bot):

| Subcarpeta | Documentos |
|------------|------------|
| `01_REVISIONES` | Evidencia revisión, dictamen |
| `02_PEDIDOS` | pedido, orden_descuento, caratula |
| `03_AUTORIZACIONES` | autorizacion.xlsx, sindicato.xlsx |
| `04_COMPULSA` | Documentos de compulsa |

**Carpeta de caso** = nombre cliente en MAYÚSCULAS (folio no forma parte del path SharePoint).

## Implementación actual

`SharePointStorageProvider`:
1. Guarda localmente (siempre)
2. Escribe espejo en `storage/sharepoint_mirror/`
3. Si `MS_GRAPH_ENABLED=true` → marca `PENDING_UPLOAD` y encola (TODO: portar `microsoft_graph.py`)

## Migración a producción

1. Portar `microsoft_graph.py` → `backend/app/services/microsoft_graph.py`
2. Portar `sharepoint_retry_queue.py` → cola de reintentos
3. Activar `STORAGE_PROVIDER=sharepoint` + `MS_GRAPH_ENABLED=true`
4. Actualizar `Document.upload_status` en cada subida
5. Job periódico de reintentos (como JobQueue en telegram_bot)

## Sin cambios en lógica de negocio

`CaseService` solo llama:

```python
self.storage.save_document(case_folder, filename, content, ...)
self.storage.save_historial(case_folder, historial)
```

El provider decide destino local, remoto o ambos.