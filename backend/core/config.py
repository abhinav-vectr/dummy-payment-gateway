import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dummy Payment Gateway"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dummy_payment.db")
    FRONTEND_CORS_ORIGINS: list[str] = ["*"]
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_for_jwt_and_demo")

    class Config:
        case_sensitive = True

settings = Settings()
