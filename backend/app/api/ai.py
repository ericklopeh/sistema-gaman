from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AIQueryRequest(BaseModel):
    question: str


class AIQueryResponse(BaseModel):
    answer: str
    sources: list[str]


_RESPONSES: dict[str, AIQueryResponse] = {
    "compulsa": AIQueryResponse(
        answer=(
            "Se encontraron 3 pedidos pendientes de compulsa. "
            "Los casos más antiguos pertenecen a la sección 21."
        ),
        sources=[
            "Historial de pedidos",
            "Documentos cargados",
            "Estados operativos",
        ],
    ),
    "talones": AIQueryResponse(
        answer=(
            "Hay 2 talones pendientes de autorización y 1 en revisión. "
            "El de mayor venta posible es REV-2026-0145 por $312,750."
        ),
        sources=[
            "Revisiones de talones",
            "Historial de autorizaciones",
        ],
    ),
    "saldos": AIQueryResponse(
        answer=(
            "Se detectaron 2 facturas con diferencias de saldo por un total "
            "de $635. La más reciente es FAC-2026-4521."
        ),
        sources=[
            "Conciliación de saldos",
            "Facturas del sistema",
        ],
    ),
}


def _match_response(question: str) -> AIQueryResponse:
    q = question.lower()
    if "compulsa" in q or "pedido" in q:
        return _RESPONSES["compulsa"]
    if "talon" in q or "talón" in q or "descuento" in q:
        return _RESPONSES["talones"]
    if "saldo" in q or "diferencia" in q or "factura" in q:
        return _RESPONSES["saldos"]
    return AIQueryResponse(
        answer=(
            "Con la información demo disponible, hay 8 casos activos distribuidos "
            "entre revisiones, pedidos, refinanciamientos y saldos. "
            "¿Deseas detalle de algún módulo en particular?"
        ),
        sources=[
            "Dashboard operativo",
            "Casos consolidados",
            "Estados operativos",
        ],
    )


@router.post("/query", response_model=AIQueryResponse)
def query_ai(body: AIQueryRequest) -> AIQueryResponse:
    return _match_response(body.question)