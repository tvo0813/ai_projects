from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

Base = declarative_base()

# Engine and session are only created when DATABASE_URL is set.
# Currently unused — auth/orders are disabled and no DB is deployed.
def _make_engine():
    if not settings.DATABASE_URL:
        return None
    return create_engine(settings.DATABASE_URL)

engine = _make_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None


def get_db():
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
