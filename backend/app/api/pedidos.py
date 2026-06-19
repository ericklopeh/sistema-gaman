from fastapi import APIRouter

from app.services.demo_data import PEDIDOS

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])


@router.get("")
def list_pedidos() -> list[dict]:
    return PEDIDOS