"""Application settings (loaded from .env)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경 변수 기반 설정.

    `.env` 파일에서 자동 로드 (대소문자 구분).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # === Application ===
    APP_NAME: str = "Hi-Five API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # === Database ===
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "mapweb"

    # === JWT ===
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7일

    # === CORS ===
    CORS_ORIGINS: str = "http://localhost:3000"

    # === Kakao OAuth ===
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""
    KAKAO_REDIRECT_URI: str = ""

    # === Kakao Map ===
    KAKAO_MAP_API_KEY: str = ""

    # === Gemini AI ===
    GEMINI_API_KEY: str = ""

    # === Upload ===
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

    @property
    def database_url(self) -> str:
        """SQLAlchemy 연결 URL (pymysql + utf8mb4)."""
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
