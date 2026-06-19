from datetime import datetime

from fastapi import APIRouter

from app.domain import constants as C
from app.services.case_service import get_case_service
from app.services.demo_data import REFINANCIAMIENTOS, SALDOS

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


@router.get("/summary")
def reportes_summary() -> dict:
    svc = get_case_service()
    cases = [c for c in svc.repo.list_all() if c.get("case_type") == C.CASE_TYPE_PEDIDO]
    hoy = datetime.now().date().isoformat()

    por_estado: dict[str, int] = {}
    por_vendedor: dict[str, int] = {}
    for c in cases:
        e = c.get("estado", "desconocido")
        por_estado[e] = por_estado.get(e, 0) + 1
        if c.get("estado") == C.ST_FINALIZADO:
            v = c.get("vendedor", "Sin vendedor")
            por_vendedor[v] = por_vendedor.get(v, 0) + 1

    comprados_hoy = [
        c for c in cases
        if c.get("estado") in (C.ST_COMPRADO, C.ST_NOTIFICADO_VENDEDOR, C.ST_FINALIZADO)
        and (c.get("compra") or {}).get("fecha", "")[:10] == hoy
    ]

    incompletos = [
        c for c in cases
        if not svc._checklist_complete(c) and c.get("estado") == C.ST_CAPTURADO
    ]

    refin_elegibles = [r for r in REFINANCIAMIENTOS if r.get("elegible")]
    saldos_diff = [s for s in SALDOS if s.get("diferencia", 0) != 0]

    return {
        "generado_en": datetime.now().isoformat(),
        "pedidos_por_estado": por_estado,
        "ventas_por_vendedor": por_vendedor,
        "pendientes_compulsa": por_estado.get(C.ST_ENVIADO_A_COMPULSA, 0),
        "pendientes_compras": por_estado.get(C.ST_EN_COMPRAS, 0),
        "comprados_hoy": len(comprados_hoy),
        "comprados_hoy_detalle": [
            {"folio": c.get("public_id"), "cliente": c.get("cliente"), "vendedor": c.get("vendedor")}
            for c in comprados_hoy
        ],
        "saldos_con_diferencia": len(saldos_diff),
        "refinanciamientos_elegibles": len(refin_elegibles),
        "documentos_incompletos": len(incompletos),
        "total_pedidos": len(cases),
    }