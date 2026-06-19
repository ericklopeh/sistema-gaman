from fastapi import APIRouter

from app.services.demo_data import CLIENTS

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("")
def list_clients() -> list[dict]:
    return CLIENTS