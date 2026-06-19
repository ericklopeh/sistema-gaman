from fastapi import APIRouter, HTTPException

from app.domain import constants as C
from app.schemas.cases import AccionMotivo, AutorizacionAprobar, CompraAccion, CompulsaAccion
from app.services.case_service import get_case_service

router = APIRouter(prefix="/api", tags=["operaciones"])


def _serialize_case(case: dict) -> dict:
    svc = get_case_service()
    return {
        "id": case["id"],
        "folio": case.get("public_id"),
        "public_id": case.get("public_id"),
        "official_folio": case.get("official_folio"),
        "cliente": case.get("cliente"),
        "order_type": case.get("order_type"),
        "tipo_venta": case.get("order_type"),
        "vendedor": case.get("vendedor"),
        "estado": case.get("estado"),
        "created_at": case.get("created_at"),
        "updated_at": case.get("updated_at"),
        "documentos": case.get("documentos", []),
        "historial": case.get("historial", []),
        "comentarios": case.get("comentarios", []),
        "checklist": svc.get_checklist(case),
    }


def _cases_for(estados: list[str]) -> list[dict]:
    svc = get_case_service()
    cases = svc.repo.list_by_status(estados)
    return [_serialize_case(c) for c in cases if c.get("case_type") == "pedido"]


# --- SISTEMAS ---

@router.get("/sistemas/pendientes")
def sistemas_pendientes() -> list[dict]:
    return _cases_for(C.ESTADOS_SISTEMAS)


@router.post("/sistemas/{case_id}/revisar")
def sistemas_revisar(case_id: int, body: AccionMotivo) -> dict:
    try:
        return get_case_service().iniciar_revision(case_id, body.usuario)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.post("/sistemas/{case_id}/aprobar")
def sistemas_aprobar(case_id: int, body: AutorizacionAprobar) -> dict:
    try:
        return get_case_service().aprobar(case_id, "Sistemas", body.model_dump())
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.post("/sistemas/{case_id}/corregir")
def sistemas_corregir(case_id: int, body: AccionMotivo) -> dict:
    try:
        return get_case_service().solicitar_correccion(case_id, body.usuario, body.motivo)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.post("/sistemas/{case_id}/rechazar")
def sistemas_rechazar(case_id: int, body: AccionMotivo) -> dict:
    try:
        return get_case_service().rechazar(case_id, body.usuario, body.motivo)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


# --- COMPULSA ---

@router.get("/compulsa/pendientes")
def compulsa_pendientes() -> list[dict]:
    return _cases_for(C.ESTADOS_COMPULSA)


@router.post("/compulsa/{case_id}/compulsar")
def compulsa_marcar(case_id: int, body: CompulsaAccion) -> dict:
    try:
        return get_case_service().compulsar(case_id, body.usuario, body.observaciones)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


# --- COMPRAS ---

@router.get("/compras/pendientes")
def compras_pendientes() -> list[dict]:
    return _cases_for([C.ST_EN_COMPRAS])


@router.post("/compras/{case_id}/comprar")
def compras_registrar(case_id: int, body: CompraAccion) -> dict:
    try:
        return get_case_service().registrar_compra(
            case_id,
            body.usuario,
            body.proveedor,
            numero_pedido=body.numero_pedido,
            nombre_proveedor=body.nombre_proveedor,
            observaciones=body.observaciones,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e