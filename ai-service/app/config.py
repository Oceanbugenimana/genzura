from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/genzura_db"
    API_SECRET: str = "secret"
    PORT: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()
