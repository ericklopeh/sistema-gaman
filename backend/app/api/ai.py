from fastapi import APIRouter
from pydantic import BaseModel

from app.domain import constants as C
from app.services.case_service import get_case_service
from app.services.demo_data import REFINANCIAMIENTOS, SALDOS

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AIQueryRequest(BaseModel):
    question: str


class AIQueryResponse(BaseModel):
    answer: str
    sources: list[str]
    demo: bool = True


def _dynamic_answer(question: str) -> AIQueryResponse:
    q = question.lower()
    svc = get_case_service()
    cases = [c for c in svc.repo.list_all() if c.get("case_type") == C.CASE_TYPE_PEDIDO]

    if "compulsa" in q or "pendiente" in q and "compulsa" in q:
        n = sum(1 for c in cases if c.get("estado") == C.ST_ENVIADO_A_COMPULSA)
        return AIQueryResponse(
            answer=f"Hay {n} pedido(s) pendientes de compulsa. Revisa el módulo /compulsa para procesarlos.",
            sources=["Casos GAMAN", "Estados operativos", "Módulo Compulsa"],
        )

    if "vendedor" in q and ("pendiente" in q or "más" in q):
        counts: dict[str, int] = {}
        for c in cases:
            if c.get("estado") not in (C.ST_FINALIZADO, C.ST_RECHAZADO):
                v = c.get("vendedor", "Sin vendedor")
                counts[v] = counts.get(v, 0) + 1
        if counts:
            top = max(counts, key=counts.get)
            return AIQueryResponse(
                answer=f"El vendedor con más pendientes es {top} ({counts[top]} casos activos).",
                sources=["Pedidos por vendedor", "Dashboard GAMAN"],
            )
        return AIQueryResponse(
            answer="No hay pendientes activos por vendedor en este momento.",
            sources=["Dashboard GAMAN"],
        )

    if "compra" in q or "compras" in q:
        n = sum(1 for c in cases if c.get("estado") == C.ST_EN_COMPRAS)
        return AIQueryResponse(
            answer=f"Faltan {n} compra(s) por realizar en el módulo /compras.",
            sources=["Módulo Compras", "Estados EN_COMPRAS"],
        )

    if "documento" in q or "incompleto" in q:
        incompletos = [
            c for c in cases
            if not svc._checklist_complete(c) and c.get("estado") == C.ST_CAPTURADO
        ]
        return AIQueryResponse(
            answer=f"{len(incompletos)} caso(s) tienen documentos incompletos en captura.",
            sources=["Checklist documentos", "Casos CAPTURADO"],
        )

    if "saldo" in q or "diferencia" in q:
        diff = sum(1 for s in SALDOS if s.get("diferencia", 0) != 0)
        return AIQueryResponse(
            answer=f"Se detectaron {diff} registros con diferencia de saldo en conciliación demo.",
            sources=["Módulo Saldos", "demo_data.py"],
        )

    if "talon" in q or "talón" in q or "refinanc" in q:
        elegibles = sum(1 for r in REFINANCIAMIENTOS if r.get("elegible"))
        return AIQueryResponse(
            answer=f"Hay {elegibles} refinanciamiento(s) elegibles (>40% pagado) en datos demo.",
            sources=["Refinanciamientos", "Talones"],
        )

    activos = sum(1 for c in cases if c.get("estado") != C.ST_FINALIZADO)
    return AIQueryResponse(
        answer=(
            f"Con los datos actuales hay {len(cases)} pedidos y {activos} activos. "
            "Pregunta por compulsa, compras, vendedores, documentos o saldos."
        ),
        sources=["Dashboard GAMAN", "Casos consolidados"],
    )


@router.post("/query", response_model=AIQueryResponse)
def query_ai(body: AIQueryRequest) -> AIQueryResponse:
    return _dynamic_answer(body.question)