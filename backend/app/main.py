from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from . import config, database
from .routes import auth, dashboard, reports, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not config.MONGODB_URI or not config.JWT_SECRET:
        raise RuntimeError("MONGODB_URI and JWT_SECRET must be set (see backend/.env.example)")
    await database.connect()
    yield
    await database.close()


app = FastAPI(
    title="Tudun Wada Community Emergency Reporting and Response API",
    description="REST API for reporting, managing and tracking community emergency incidents.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PyMongoError)
async def database_error_handler(request: Request, exc: PyMongoError):
    return JSONResponse(status_code=503, content={"detail": "The database is temporarily unavailable. Please try again shortly."})


app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "Community Emergency Reporting API", "docs": "/docs"}


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok"}
