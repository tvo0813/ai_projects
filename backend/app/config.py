from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    STORE_NAME: str = ""
    STORE_SLUG: str = "phin-and-beans"  # matches the filename in backend/menus/<slug>.csv
    STORE_DOMAIN: str = ""  # prod domain e.g. "phinandbeans.com"; blank = no extra CORS origin

    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/store"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    SQUARE_ACCESS_TOKEN: str = ""
    SQUARE_LOCATION_ID: str = ""
    AWS_REGION: str = "us-east-1"
    MENU_S3_BUCKET: str = ""   # e.g. "coffee-tea-app-menus"; blank = local CSV only
    GOOGLE_MAPS_API_KEY: str = ""
    DYNAMODB_TABLE_MENU: str = ""
    DYNAMODB_TABLE_DEALS: str = ""
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
