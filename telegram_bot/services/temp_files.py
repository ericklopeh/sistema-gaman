import shutil
import uuid
from pathlib import Path

from telegram import File

from config import settings


def session_dir(telegram_id: int) -> Path:
    path = settings.TEMP_DIR / str(telegram_id) / uuid.uuid4().hex[:8]
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_telegram_photo(file: File, dest_dir: Path, name: str = "photo.jpg") -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / name
    await file.download_to_drive(custom_path=str(dest))
    return dest


def cleanup_dir(path: Path | None) -> None:
    if path and path.exists():
        shutil.rmtree(path, ignore_errors=True)