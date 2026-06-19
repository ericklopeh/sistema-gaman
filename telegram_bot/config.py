import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")


class Settings:
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    GAMAN_API_URL: str = os.getenv("GAMAN_API_URL", "http://localhost:8010").rstrip("/")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("1", "true", "yes")
    OPERATING_HOURS_ENABLED: bool = os.getenv("OPERATING_HOURS_ENABLED", "true").lower() in ("1", "true", "yes")
    TEMP_DIR: Path = Path(os.getenv("TELEGRAM_TEMP_DIR", "/tmp/gaman-telegram"))


settings = Settings()
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)