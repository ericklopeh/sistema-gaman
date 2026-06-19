from fastapi import APIRouter

from app.services.case_service import get_case_service
from app.services.demo_data import REFINANCIAMIENTOS, SALDOS, TALONES

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary() -> dict:
    stats = get_case_service().dashboard_stats()

    return {
        **stats,
        "talones_pendientes": sum(
            1 for t in TALONES if t["estado"] in ("pendiente", "en_revision")
        ),
        "pedidos_activos": stats["total_casos"] - stats["casos_por_estado"].get("FINALIZADO", 0),
        "refinanciamientos": sum(
            1 for r in REFINANCIAMIENTOS if r["estado"] != "aprobado"
        ),
        "diferencias_saldos": sum(1 for s in SALDOS if s["diferencia"] != 0),
    }