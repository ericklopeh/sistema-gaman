from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai import router as ai_router
from app.api.auth import router as auth_router
from app.api.casos import router as casos_router
from app.api.cases import router as cases_router
from app.api.config_api import router as config_router
from app.api.clients import router as clients_router
from app.api.dashboard import router as dashboard_router
from app.api.demo import router as demo_router
from app.api.documentos import router as documentos_router
from app.api.health import router as health_router
from app.api.notificaciones import router as notificaciones_router
from app.api.operaciones import router as operaciones_router
from app.api.pedidos import router as pedidos_router
from app.api.reportes import router as reportes_router
from app.api.refinanciamientos import router as refinanciamientos_router
from app.api.saldos import router as saldos_router
from app.api.talones import router as talones_router
from app.api.vendedores import router as vendedores_router

app = FastAPI(
    title="Sistema GAMAN API",
    version="0.2.0",
)


@app.on_event("startup")
def startup_seed():
    from app.services.seed_demo import seed_if_empty
    seed_if_empty()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3010",
        "http://192.168.68.123:3010",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(config_router)
app.include_router(demo_router)
app.include_router(dashboard_router)
app.include_router(casos_router)
app.include_router(cases_router)
app.include_router(documentos_router)
app.include_router(reportes_router)
app.include_router(clients_router)
app.include_router(talones_router)
app.include_router(pedidos_router)
app.include_router(vendedores_router)
app.include_router(notificaciones_router)
app.include_router(operaciones_router)
app.include_router(refinanciamientos_router)
app.include_router(saldos_router)
app.include_router(ai_router)