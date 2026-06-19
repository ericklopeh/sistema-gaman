from fastapi import APIRouter

from app.services.demo_data import CASES

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("")
def list_cases() -> list[dict]:
    return CASES