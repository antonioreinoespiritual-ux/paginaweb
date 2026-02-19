from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.jobs.scheduler import start_scheduler
from app.routers.flows import router as flows_router
from app.routers.hypotheses import router as hypotheses_router
from app.routers.interviews import router as interviews_router
from app.routers.sales import router as sales_router

app = FastAPI(title="Research OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hypotheses_router)
app.include_router(interviews_router)
app.include_router(flows_router)
app.include_router(sales_router)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    start_scheduler()


@app.get("/health")
def health():
    return {"ok": True}
