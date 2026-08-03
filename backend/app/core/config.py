"""
WalkWithMe Backend — Configuration Settings
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "WalkWithMe Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # OpenAI API Key
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:8000",
        "http://127.0.0.1:8081",
        "*",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
