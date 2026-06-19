import json
from pathlib import Path

from app.core.config import settings
from app.domain import constants as C
from app.storage.provider import StorageProvider


def _sanitize(text: str) -> str:
    for ch in '<>:"/\\|?*':
        text = text.replace(ch, "")
    return "_".join(text.strip().split())


class LocalStorageProvider(StorageProvider):
    """Almacenamiento local — estructura idéntica a la esperada en SharePoint."""

    def __init__(self, base_path: str | Path | None = None) -> None:
        self.base_path = Path(base_path or settings.STORAGE_PATH).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    @property
    def provider_name(self) -> str:
        return "local"

    def case_folder_name(self, folio: str, cliente: str) -> str:
        return f"FOLIO_{folio}_{_sanitize(cliente).upper()}"

    def ensure_case_folder(self, semana: str, folio: str, cliente: str) -> Path:
        semana_dir = self.base_path / "uploads" / semana
        case_dir = semana_dir / self.case_folder_name(folio, cliente)
        case_dir.mkdir(parents=True, exist_ok=True)
        return case_dir

    def _sharepoint_mirror_path(
        self, semana: str, vendedor: str, cliente: str, document_type: str, filename: str
    ) -> Path:
        """Ruta espejo SharePoint: {semana}/{vendedor}/{CLIENTE}/{subcarpeta}/{file}"""
        sub = C.sharepoint_subfolder_for_doc(document_type)
        return (
            self.base_path
            / "sharepoint_mirror"
            / semana
            / _sanitize(vendedor)
            / _sanitize(cliente).upper()
            / sub
            / filename
        )

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
        local_path = case_folder / filename
        local_path.write_bytes(content)

        mirror = self._sharepoint_mirror_path(
            semana, vendedor, cliente, document_type, filename
        )
        mirror.parent.mkdir(parents=True, exist_ok=True)
        mirror.write_bytes(content)

        return {
            "local_path": str(local_path),
            "mirror_path": str(mirror),
            "sharepoint_url": None,
            "upload_status": "UPLOADED",
            "provider": self.provider_name,
        }

    def save_historial(self, case_folder: Path, historial: list[dict]) -> Path:
        path = case_folder / "historial.json"
        path.write_text(json.dumps(historial, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def get_download_path(self, case_folder: Path, filename: str) -> Path | None:
        path = case_folder / filename
        return path if path.exists() else None