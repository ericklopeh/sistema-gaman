from fastapi import APIRouter

from app.services.demo_data import SALDOS

router = APIRouter(prefix="/api/saldos", tags=["saldos"])


@router.get("")
def list_saldos() -> list[dict]:
    return SALDOS