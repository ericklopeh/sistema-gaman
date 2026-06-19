from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.repositories.case_repository import get_case_repository
from app.services.telegram_notification_service import get_telegram_notification_service

router = APIRouter(prefix="/api/notificaciones", tags=["notificaciones"])


class TelegramNotificacionRequest(BaseModel):
    chat_id: int
    folio: str
    cliente: str
    proveedor: str = ""
    numero_pedido: str = ""
    estado: str = "COMPRADO"
    case_id: int | None = None


@router.post("/telegram")
def enviar_notificacion_telegram(body: TelegramNotificacionRequest) -> dict:
    """Envía notificación al vendedor. Mock en historial si no hay token."""
    svc = get_telegram_notification_service()
    result = svc.notify_custom(
        body.chat_id,
        folio=body.folio,
        cliente=body.cliente,
        proveedor=body.proveedor,
        numero_pedido=body.numero_pedido,
        estado=body.estado,
    )

    if body.case_id:
        repo = get_case_repository()
        case = repo.get(body.case_id)
        if case:
            case.setdefault("notificaciones", []).append({"canal": "telegram", **result})
            repo.update(body.case_id, case)

    return result