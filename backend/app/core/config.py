from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Sistema GAMAN"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    DATABASE_URL: str = (
        "postgresql+psycopg://gaman_user:gaman_password@localhost:5434/gaman_db"
    )
    STORAGE_PATH: str = "./storage"
    STORAGE_PROVIDER: str = "local"  # local | sharepoint

    # Microsoft Graph / SharePoint (telegram_bot_REFERENCIA)
    MS_GRAPH_ENABLED: bool = False
    MS_ROOT_FOLDER: str = "GAMAN"
    MS_TENANT_ID: str = ""
    MS_CLIENT_ID: str = ""
    MS_CLIENT_SECRET: str = ""
    MS_SITE_ID: str = ""
    MS_DRIVE_ID: str = ""

    # Telegram — notificaciones desde backend (compras → vendedor)
    TELEGRAM_BOT_TOKEN: str = ""

    # Modo demo — usuarios semilla, mocks, sin PostgreSQL/SharePoint/ERP real
    DEMO_MODE: bool = True

    # Horario operativo — captura VENDEDOR (Lun–Vie 09:00–18:00)
    OPERATING_HOURS_ENABLED: bool = True
    OPERATING_HOURS_TIMEZONE: str = "America/Monterrey"
    OPERATING_HOURS_START: str = "09:00"
    OPERATING_HOURS_END: str = "18:00"
    OPERATING_HOURS_DAYS: str = "1,2,3,4,5"  # ISO: 1=Lunes … 7=Domingo (legacy)
    OPERATING_DAYS: str = "MON,TUE,WED,THU,FRI"


settings = Settings()