from app.core.config import settings
from app.storage.local_provider import LocalStorageProvider
from app.storage.provider import StorageProvider
from app.storage.sharepoint_provider import SharePointStorageProvider


def get_storage_provider() -> StorageProvider:
    if settings.STORAGE_PROVIDER == "sharepoint":
        return SharePointStorageProvider()
    return LocalStorageProvider()


__all__ = ["StorageProvider", "LocalStorageProvider", "SharePointStorageProvider", "get_storage_provider"]