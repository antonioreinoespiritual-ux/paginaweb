import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine
from app.routers.flows import router as flows_router
from app.routers.hypotheses import router as hypotheses_router
from app.routers.interviews import router as interviews_router
from app.routers.interview_templates import router as templates_router
from app.routers.projects import router as projects_router
from app.routers.sales_playbooks import router as playbooks_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("research-os")

app = FastAPI(title="Research OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(hypotheses_router)
app.include_router(flows_router)
app.include_router(templates_router)
app.include_router(interviews_router)
app.include_router(playbooks_router)


@app.on_event("startup")
def startup() -> None:
    Path(".").mkdir(exist_ok=True)
    Base.metadata.create_all(bind=engine)
    logger.info("DB ready and API started")


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "type": "http_error"})


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "type": "server_error"})


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/routes")
def list_routes():
    return sorted([r.path for r in app.routes if hasattr(r, "path")])
