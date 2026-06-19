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


settings = Settings()