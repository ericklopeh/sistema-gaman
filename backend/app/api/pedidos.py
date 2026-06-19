import io

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from PIL import Image

from app.domain import constants as C
from app.services.business_hours import assert_capture_allowed
from app.services.case_service import get_case_service

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])


def _placeholder_image(label: str) -> bytes:
    from PIL import ImageDraw

    img = Image.new("RGB", (400, 200), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    draw.text((20, 80), label, fill=(50, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


async def _read_upload(file: UploadFile | None, label: str) -> bytes | None:
    if file and file.filename:
        return await file.read()
    return None


@router.get("")
def list_pedidos() -> list[dict]:
    svc = get_case_service()
    cases = svc.repo.list_all()
    return [_to_pedido_summary(c) for c in cases if c.get("case_type") == C.CASE_TYPE_PEDIDO]


@router.post("/from-telegram")
async def capturar_desde_telegram(
    cliente: str = Form(...),
    order_type: str = Form(...),
    vendedor: str = Form(...),
    seller_telegram_chat_id: int = Form(...),
    semana: int | None = Form(None),
    pedido: UploadFile | None = File(None),
    orden_descuento: UploadFile | None = File(None),
    caratula_banco: UploadFile | None = File(None),
) -> dict:
    """Crea pedido desde bot Telegram. Acepta documentos opcionales en el mismo request."""
    assert_capture_allowed(None, channel="telegram")
    order_type = C.normalize_order_type(order_type)
    documentos: dict[str, bytes] = {}

    pedido_bytes = await _read_upload(pedido, "PEDIDO")
    orden_bytes = await _read_upload(orden_descuento, "ORDEN DESCUENTO")
    caratula_bytes = await _read_upload(caratula_banco, "CARATULA BANCO")

    if pedido_bytes:
        documentos[C.DOC_PEDIDO] = pedido_bytes
    if orden_bytes:
        documentos[C.DOC_ORDEN_DESCUENTO] = orden_bytes
    if caratula_bytes:
        documentos[C.DOC_CARATULA_BANCARIA] = caratula_bytes

    try:
        case = get_case_service().crear_pedido_telegram(
            cliente=cliente,
            order_type=order_type,
            vendedor=vendedor,
            seller_telegram_chat_id=seller_telegram_chat_id,
            documentos=documentos if documentos else None,
            semana=semana,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    return _telegram_response(case)


@router.post("/{folio}/documentos")
async def agregar_documento(
    folio: str,
    document_type: str = Form(...),
    archivo: UploadFile = File(...),
    usuario: str = Form("telegram"),
    x_gaman_role: str | None = Header(None, alias="X-Gaman-Role"),
) -> dict:
    """Sube un documento a un pedido existente (por folio oficial o PED-XXXXXX)."""
    role = x_gaman_role or ("VENDEDOR" if usuario == "telegram" else None)
    assert_capture_allowed(role, channel="telegram" if usuario == "telegram" else "web")
    allowed = {
        C.DOC_PEDIDO, C.DOC_ORDEN_DESCUENTO, C.DOC_CARATULA_BANCARIA,
        "pedido", "orden_descuento", "caratula_banco", "caratula_bancaria",
    }
    if document_type not in allowed:
        raise HTTPException(400, f"Tipo de documento inválido: {document_type}")

    tipo = document_type
    if tipo in ("caratula_banco", "caratula_bancaria"):
        tipo = C.DOC_CARATULA_BANCARIA

    content = await archivo.read()
    try:
        case = get_case_service().agregar_documento_por_folio(
            folio=folio,
            document_type=tipo,
            content=content,
            action_user=usuario,
        )
    except ValueError as e:
        raise HTTPException(404, str(e)) from e

    return _telegram_response(case)


@router.post("/captura")
async def capturar_pedido(
    cliente: str = Form(...),
    order_type: str = Form(...),
    vendedor: str = Form(...),
    semana: int | None = Form(None),
    pedido: UploadFile | None = File(None),
    orden_descuento: UploadFile | None = File(None),
    caratula_banco: UploadFile | None = File(None),
    x_gaman_role: str | None = Header(None, alias="X-Gaman-Role"),
) -> dict:
    assert_capture_allowed(x_gaman_role or "VENDEDOR")
    order_type = C.normalize_order_type(order_type)
    documentos: dict[str, bytes] = {}

    documentos[C.DOC_PEDIDO] = (await _read_upload(pedido, "PEDIDO")) or _placeholder_image("PEDIDO")
    documentos[C.DOC_ORDEN_DESCUENTO] = (
        await _read_upload(orden_descuento, "ORDEN DESCUENTO") or _placeholder_image("ORDEN DESCUENTO")
    )

    if order_type == C.ORDER_TYPE_DINERO:
        documentos[C.DOC_CARATULA_BANCARIA] = (
            await _read_upload(caratula_banco, "CARATULA BANCO") or _placeholder_image("CARATULA BANCO")
        )

    try:
        case = get_case_service().capturar_pedido(
            cliente=cliente,
            order_type=order_type,
            vendedor=vendedor,
            documentos=documentos,
            semana=semana,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    return case


@router.post("/{case_id}/finalizar")
def finalizar_pedido(
    case_id: int,
    usuario: str = "Vendedor",
    x_gaman_role: str | None = Header(None, alias="X-Gaman-Role"),
) -> dict:
    assert_capture_allowed(x_gaman_role or "VENDEDOR")
    try:
        return get_case_service().finalizar_captura(case_id, usuario)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


def _telegram_response(case: dict) -> dict:
    svc = get_case_service()
    return {
        "id": case["id"],
        "folio": case["public_id"],
        "official_folio": case.get("official_folio"),
        "cliente": case["cliente"],
        "estado": case.get("estado"),
        "order_type": case.get("order_type"),
        "checklist": svc.get_checklist(case),
        "documentos": [d["tipo"] for d in case.get("documentos", [])],
    }


def _to_pedido_summary(case: dict) -> dict:
    return {
        "id": case["id"],
        "folio": case["public_id"],
        "cliente": case["cliente"],
        "tipo_venta": case.get("order_type", "mueble"),
        "vendedor": case["vendedor"],
        "documentos": [d["tipo"] for d in case.get("documentos", [])],
        "estado": case.get("estado", ""),
        "official_folio": case.get("official_folio"),
        "semana": case.get("semana"),
        "checklist": get_case_service().get_checklist(case),
    }