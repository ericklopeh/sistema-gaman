"""SharePointStorageProvider — preparado para Microsoft Graph (telegram_bot_REFERENCIA).

Inicialmente delega al almacenamiento local y registra la ruta SharePoint esperada.
Cuando MS_GRAPH_* esté configurado, subirá vía Graph API.
"""

from pathlib import Path

from app.core.config import settings
from app.domain import constants as C
from app.storage.local_provider import LocalStorageProvider, _sanitize
from app.storage.provider import StorageProvider


class SharePointStorageProvider(StorageProvider):
    def __init__(self) -> None:
        self._local = LocalStorageProvider()
        self.root_folder = settings.MS_ROOT_FOLDER

    @property
    def provider_name(self) -> str:
        return "sharepoint"

    def _sp_path(self, semana: str, vendedor: str, cliente: str, document_type: str, filename: str) -> str:
        sub = C.sharepoint_subfolder_for_doc(document_type)
        cliente_upper = _sanitize(cliente).upper()
        vendedor_clean = _sanitize(vendedor)
        return f"{self.root_folder}/{semana}/{vendedor_clean}/{cliente_upper}/{sub}/{filename}"

    def ensure_case_folder(self, semana: str, folio: str, cliente: str) -> Path:
        return self._local.ensure_case_folder(semana, folio, cliente)

    def save_document(
        self,
        case_folder: Path,
        filename: str,
        content: bytes,
        *,
        semana: str,
        vendedor: str,
        cliente: str,
        folio: str,
        document_type: str,
    ) -> dict:
        result = self._local.save_document(
            case_folder, filename, content,
            semana=semana, vendedor=vendedor, cliente=cliente,
            folio=folio, document_type=document_type,
        )
        sp_path = self._sp_path(semana, vendedor, cliente, document_type, filename)
        result["sharepoint_path"] = sp_path
        result["provider"] = self.provider_name

        if settings.MS_GRAPH_ENABLED:
            # TODO: integrar microsoft_graph.upload_document_to_sharepoint
            result["upload_status"] = "PENDING_UPLOAD"
            result["sharepoint_url"] = None
        else:
            result["upload_status"] = "UPLOADED"
            result["sharepoint_url"] = f"sharepoint://{sp_path}"

        return result

    def save_historial(self, case_folder: Path, historial: list[dict]) -> Path:
        return self._local.save_historial(case_folder, historial)

    def get_download_path(self, case_folder: Path, filename: str) -> Path | None:
        return self._local.get_download_path(case_folder, filename)