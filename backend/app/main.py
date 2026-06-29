from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import stations


app = FastAPI(
    title="ZapRos API",
    description="API для сервиса поиска АЗС и мониторинга цен на топливо",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations.router)


@app.get("/")
async def root():
    return {"message": "ZapRos API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
