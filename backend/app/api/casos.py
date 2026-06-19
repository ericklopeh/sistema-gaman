from fastapi import APIRouter, HTTPException

from app.services.case_service import get_case_service

router = APIRouter(prefix="/api/casos", tags=["casos"])


def _serialize_case(case: dict) -> dict:
    svc = get_case_service()
    return {
        "id": case["id"],
        "folio": case.get("public_id"),
        "official_folio": case.get("official_folio"),
        "cliente": case.get("cliente"),
        "rfc": case.get("rfc", ""),
        "seccion": case.get("seccion", ""),
        "vendedor": case.get("vendedor"),
        "tipo_caso": case.get("case_type"),
        "tipo_venta": case.get("order_type"),
        "estado": case.get("estado"),
        "created_at": case.get("created_at"),
        "updated_at": case.get("updated_at"),
        "documentos": case.get("documentos", []),
        "historial": case.get("historial", []),
        "comentarios": case.get("comentarios", []),
        "folder_path": case.get("folder_path"),
        "sharepoint_path": case.get("sharepoint_path"),
        "compra": case.get("compra"),
        "notificaciones": case.get("notificaciones", []),
        "checklist": svc.get_checklist(case),
    }


@router.get("")
def list_casos() -> list[dict]:
    svc = get_case_service()
    cases = [c for c in svc.repo.list_all() if c.get("case_type") == "pedido"]
    return [_serialize_case(c) for c in cases]


@router.get("/{folio}")
def get_caso_by_folio(folio: str) -> dict:
    case = get_case_service().repo.get_by_folio(folio)
    if not case:
        raise HTTPException(404, f"Caso no encontrado: {folio}")
    return _serialize_case(case)