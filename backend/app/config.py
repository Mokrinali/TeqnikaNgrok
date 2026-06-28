from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@db:5432/teknika"
    ADMIN_CODE: str = "0000"
    JWT_SECRET: str = "change-this-secret"
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"

settings = Settings()
