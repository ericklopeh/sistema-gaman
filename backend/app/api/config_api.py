from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.services.business_hours import (
    get_operating_hours_config,
    save_operating_hours_config,
    status_payload,
)

router = APIRouter(prefix="/api/config", tags=["config"])


class HorarioOperativoUpdate(BaseModel):
    enabled: bool | None = None
    timezone: str | None = None
    start: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    end: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    days: list[int] | None = Field(None, description="ISO weekday 1=Lunes … 7=Domingo")


@router.get("/horario-operativo")
def get_horario_operativo() -> dict:
    return status_payload()


@router.patch("/horario-operativo")
def update_horario_operativo(
    body: HorarioOperativoUpdate,
    x_gaman_role: str | None = Header(None, alias="X-Gaman-Role"),
) -> dict:
    """Actualiza horario — solo ADMIN (configuración futura desde GAMAN)."""
    role = (x_gaman_role or "").upper()
    if role != "ADMIN":
        raise HTTPException(403, "Solo ADMIN puede modificar el horario operativo")
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "Sin cambios")
    return save_operating_hours_config(data)