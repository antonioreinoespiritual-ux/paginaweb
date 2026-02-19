from fastapi import FastAPI
from app.routers.hypotheses import router as hypotheses_router
from app.routers.interviews import router as interviews_router
from app.routers.flows import router as flows_router
from app.routers.sales import router as sales_router
from app.jobs.scheduler import start_scheduler

app = FastAPI(title="Research OS API")

app.include_router(hypotheses_router)
app.include_router(interviews_router)
app.include_router(flows_router)
app.include_router(sales_router)


@app.on_event("startup")
def startup() -> None:
    start_scheduler()


@app.get("/health")
def health():
    return {"ok": True}
