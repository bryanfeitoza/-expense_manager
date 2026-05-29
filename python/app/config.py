import re
from pydantic_settings import BaseSettings


def parse_expiry(value: str) -> int:
    value = str(value)
    match = re.match(r'^(\d+)\s*(m|min|minute|minutes|d|day|days)?$', value.strip(), re.IGNORECASE)
    if not match:
        return 15
    num = int(match.group(1))
    unit = (match.group(2) or 'm')[0].lower()
    return num if unit == 'm' else num * 1440


class Settings(BaseSettings):
    DB_HOST: str = "db"
    DB_PORT: int = 5432
    DB_NAME: str = "gerenciador_gastos"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    JWT_ACCESS_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_ACCESS_EXPIRES_IN: str = "15"
    JWT_REFRESH_EXPIRES_IN: str = "10080"
    AI_API_KEY: str = ""
    AI_API_URL: str = "https://api.openai.com/v1"
    AI_MODEL: str = "gpt-4"
    PYTHON_PORT: int = 8000
    PYTHON_ENV: str = "development"

    class Config:
        env_file = ".env"

    @property
    def access_token_expiry_minutes(self) -> int:
        return parse_expiry(self.JWT_ACCESS_EXPIRES_IN)

    @property
    def refresh_token_expiry_minutes(self) -> int:
        return parse_expiry(self.JWT_REFRESH_EXPIRES_IN)


settings = Settings()
