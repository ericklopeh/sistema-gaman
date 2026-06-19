from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai import router as ai_router
from app.api.cases import router as cases_router
from app.api.clients import router as clients_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.pedidos import router as pedidos_router
from app.api.refinanciamientos import router as refinanciamientos_router
from app.api.saldos import router as saldos_router
from app.api.talones import router as talones_router

app = FastAPI(
    title="Sistema GAMAN API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(dashboard_router)
app.include_router(cases_router)
app.include_router(clients_router)
app.include_router(talones_router)
app.include_router(pedidos_router)
app.include_router(refinanciamientos_router)
app.include_router(saldos_router)
app.include_router(ai_router)