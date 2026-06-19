from fastapi import APIRouter

from app.services.demo_data import REFINANCIAMIENTOS

router = APIRouter(prefix="/api/refinanciamientos", tags=["refinanciamientos"])


@router.get("")
def list_refinanciamientos() -> list[dict]:
    return REFINANCIAMIENTOS