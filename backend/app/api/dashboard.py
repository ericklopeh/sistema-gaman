from fastapi import APIRouter

from app.services.demo_data import (
    ACTIVITY,
    CASES,
    DOCUMENTS,
    PEDIDOS,
    REFINANCIAMIENTOS,
    SALDOS,
    TALONES,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary() -> dict:
    casos_por_estado: dict[str, int] = {}
    for caso in CASES:
        estado = caso["estado"]
        casos_por_estado[estado] = casos_por_estado.get(estado, 0) + 1

    return {
        "talones_pendientes": sum(
            1 for t in TALONES if t["estado"] in ("pendiente", "en_revision")
        ),
        "pedidos_activos": sum(
            1
            for p in PEDIDOS
            if p["estado"] not in ("entregado", "cancelado")
        ),
        "refinanciamientos": sum(
            1 for r in REFINANCIAMIENTOS if r["estado"] != "aprobado"
        ),
        "diferencias_saldos": sum(
            1 for s in SALDOS if s["diferencia"] != 0
        ),
        "casos_por_estado": casos_por_estado,
        "actividad_reciente": ACTIVITY,
        "documentos_recientes": DOCUMENTS,
    }