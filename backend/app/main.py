from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from .routers import auth, menu, orders, deals, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title=f"{settings.STORE_NAME} API", version="1.0.0", docs_url="/api/docs", redoc_url="/api/redoc")

_origins = ["http://localhost:5173", "http://localhost:3000"]
if settings.STORE_DOMAIN:
    _origins.append(f"https://{settings.STORE_DOMAIN}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(deals.router)
app.include_router(users.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": f"{settings.STORE_NAME} API"}
