from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "GuildOS API"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # AI
    NVIDIA_NIM_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""

    # External APIs
    PRICECHARTING_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Security
    CRON_SECRET: str = "dev-cron-secret-change-in-production"
    BLACKLIST_VERIFICATION_KEY: str = "dev-key-change-in-production"

    # App
    DEMO_MODE: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://*.guildos.com"]

    # Redis (for Celery task queue — Phase 2)
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"


settings = Settings()
