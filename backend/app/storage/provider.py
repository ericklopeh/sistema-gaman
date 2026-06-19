from abc import ABC, abstractmethod
from pathlib import Path


class StorageProvider(ABC):
    """Capa abstracta de almacenamiento — local o SharePoint."""

    @abstractmethod
    def ensure_case_folder(self, semana: str, folio: str, cliente: str) -> Path:
        """Crea/obtiene carpeta del caso: SEM_XX/FOLIO_CLIENTE/"""

    @abstractmethod
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
        """Guarda documento y retorna metadata (path local + url remota si aplica)."""

    @abstractmethod
    def save_historial(self, case_folder: Path, historial: list[dict]) -> Path:
        """Persiste historial.json en la carpeta del caso."""

    @abstractmethod
    def get_download_path(self, case_folder: Path, filename: str) -> Path | None:
        """Resuelve ruta local para descarga."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass