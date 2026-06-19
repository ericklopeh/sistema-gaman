from fastapi import APIRouter

from app.services.demo_data import TALONES

router = APIRouter(prefix="/api/talones", tags=["talones"])


@router.get("")
def list_talones() -> list[dict]:
    return TALONES