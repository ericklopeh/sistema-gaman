from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings
from app.services.business_hours import status_payload
from app.services.seed_demo import seed_demo_data

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("/seed")
def run_seed(force: bool = Query(False)) -> dict:
    if not settings.DEMO_MODE:
        raise HTTPException(403, "Seed solo disponible en DEMO_MODE")
    return seed_demo_data(force=force)


@router.get("/status")
def demo_status() -> dict:
    from app.services.case_service import get_case_service

    svc = get_case_service()
    return {
        "demo_mode": settings.DEMO_MODE,
        "storage_provider": settings.STORAGE_PROVIDER,
        "telegram_configured": bool(settings.TELEGRAM_BOT_TOKEN),
        "sharepoint_enabled": settings.MS_GRAPH_ENABLED,
        "postgresql": "pendiente",
        "erp": "pendiente",
        "ia_rag": "mock",
        "total_casos": len(svc.repo.list_all()),
        "backend_url": "http://localhost:8010",
        "horario_operativo": status_payload(),
    }