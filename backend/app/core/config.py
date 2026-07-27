from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Bu qiymatlar .env.example / .env.prod.example ichida placeholder sifatida
# ochiq yozilgan (yoki koddagi defolt) — production'da ular hech qachon
# haqiqiy SECRET_KEY bo'lishi mumkin emas, chunki ular hammaga ma'lum.
_INSECURE_SECRET_KEYS = {
    "dev-secret-change-me",
    "change-this-to-a-long-random-string-in-production",
    "CHANGE_ME_LONG_RANDOM_STRING",
    "",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+psycopg2://davreestr:davreestr@localhost:5432/davreestr"
    REDIS_URL: str = "redis://localhost:6379/0"
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    QR_VERIFY_BASE_URL: str = "http://localhost:8000/api/v1/public/verify"

    PROJECT_NAME: str = "Davreestr Portal API"
    API_V1_PREFIX: str = "/api/v1"
    UPLOAD_DIR: str = "uploads"

    @model_validator(mode="after")
    def _guard_production_secret_key(self) -> "Settings":
        if self.ENVIRONMENT == "production" and (
            self.SECRET_KEY.strip() in _INSECURE_SECRET_KEYS or len(self.SECRET_KEY) < 32
        ):
            raise ValueError(
                "ENVIRONMENT=production, lekin SECRET_KEY standart/placeholder yoki juda qisqa "
                "(kamida 32 belgi kerak). Serverda kuchli qiymat generatsiya qiling: "
                "openssl rand -hex 32 — va uni .env faylidagi SECRET_KEY'ga yozing."
            )
        return self


settings = Settings()
