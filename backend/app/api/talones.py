from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse

from app.schemas.talones import AutorizacionCreate, RevisionCreate, TalonDetail, TalonSummary
from app.services import talon_store
from app.services.business_hours import assert_capture_allowed

router = APIRouter(prefix="/api/talones", tags=["talones"])


@router.get("", response_model=list[TalonSummary])
def list_talones() -> list[dict]:
    return talon_store.list_talones()


@router.post("/revisiones", response_model=TalonDetail)
def crear_revision(
    payload: RevisionCreate,
    x_gaman_role: str | None = Header(None, alias="X-Gaman-Role"),
) -> dict:
    assert_capture_allowed(x_gaman_role or "VENDEDOR")
    record = talon_store.crear_revision(payload.model_dump())
    talon_store.generar_revision_excel(record["id"])
    return _to_detail(record)


@router.get("/{talon_id}", response_model=TalonDetail)
def get_talon(talon_id: int) -> dict:
    record = talon_store.get_talon(talon_id)
    if not record:
        raise HTTPException(status_code=404, detail="Talón no encontrado")
    if record.get("revision"):
        return _to_detail(record)
    raise HTTPException(
        status_code=404,
        detail="Talón demo sin revisión completa. Cree una nueva revisión.",
    )


@router.get("/{talon_id}/mensaje")
def get_mensaje(talon_id: int) -> dict:
    record = talon_store.get_talon(talon_id)
    if not record or not record.get("mensaje_vendedor"):
        raise HTTPException(status_code=404, detail="Mensaje no disponible")
    return {"mensaje": record["mensaje_vendedor"]}


@router.post("/{talon_id}/generar-revision")
def generar_revision(talon_id: int) -> dict:
    result = talon_store.generar_revision_excel(talon_id)
    if not result:
        raise HTTPException(status_code=404, detail="Talón no encontrado")
    return result


@router.post("/{talon_id}/generar-autorizacion")
def generar_autorizacion(talon_id: int, payload: AutorizacionCreate) -> dict:
    result = talon_store.generar_autorizacion(talon_id, payload.model_dump())
    if not result:
        raise HTTPException(status_code=404, detail="Talón no encontrado")
    return result


@router.get("/{talon_id}/download/{tipo}")
def download_archivo(talon_id: int, tipo: str):
    if tipo not in ("revision", "autorizacion", "sindicato"):
        raise HTTPException(status_code=400, detail="Tipo de archivo inválido")

    path = talon_store.get_archivo_path(talon_id, tipo)
    if not path:
        if tipo == "revision":
            talon_store.generar_revision_excel(talon_id)
            path = talon_store.get_archivo_path(talon_id, tipo)
        if not path:
            raise HTTPException(status_code=404, detail="Archivo no generado aún")

    return FileResponse(
        path=path,
        filename=path.name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


def _to_detail(record: dict) -> dict:
    archivos = record.get("archivos", {})
    return {
        "id": record["id"],
        "folio": record["folio"],
        "cliente": record["cliente"],
        "rfc": record["rfc"],
        "seccion": record["seccion"],
        "vendedor": record["vendedor"],
        "descuento_actual": record["descuento_actual"],
        "descuento_nuevo": record["descuento_nuevo"],
        "venta_posible": record["venta_posible"],
        "estado": record["estado"],
        "mensaje_generado": bool(record.get("mensaje_vendedor")),
        "revision_excel": "revision" in archivos,
        "autorizacion_excel": "autorizacion" in archivos,
        "sindicato_excel": "sindicato" in archivos,
        "revision": record["revision"],
        "mensaje_vendedor": record.get("mensaje_vendedor"),
        "resumen_refinanciamiento": record.get("resumen_refinanciamiento"),
        "archivos": archivos,
        "autorizacion": record.get("autorizacion"),
    }