import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

# Instantiate settings
try:
    from typing import Optional
    settings = Settings()
except Exception as e:
    # Safe fallback if pydantic-settings throws errors
    class FallbackSettings:
        API_PROVIDER = os.getenv("API_PROVIDER", "gemini")
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    settings = FallbackSettings()
