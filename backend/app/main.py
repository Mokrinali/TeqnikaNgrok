import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .database import create_tables
from .config import settings
from .routers import auth, sites, contractors, equipment, logs, trips, worktypes, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    Path("/app/photos/entry").mkdir(parents=True, exist_ok=True)
    Path("/app/photos/exit").mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="ტექნიკის ტაბელი API", lifespan=lifespan)

_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/photos", StaticFiles(directory="/app/photos"), name="photos")

app.include_router(auth.router,        prefix="/api/auth",        tags=["auth"])
app.include_router(sites.router,       prefix="/api/sites",       tags=["sites"])
app.include_router(contractors.router, prefix="/api/contractors",  tags=["contractors"])
app.include_router(equipment.router,   prefix="/api/equipment",    tags=["equipment"])
app.include_router(logs.router,        prefix="/api/logs",         tags=["logs"])
app.include_router(trips.router,       prefix="/api/trips",        tags=["trips"])
app.include_router(worktypes.router,   prefix="/api/work-types",   tags=["worktypes"])
app.include_router(reports.router,     prefix="/api/reports",      tags=["reports"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
