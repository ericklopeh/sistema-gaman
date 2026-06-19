"""Semilla demo completa para presentación — casos en múltiples estados."""

from datetime import datetime

from app.core.config import settings
from app.domain import constants as C
from app.repositories.case_repository import get_case_repository
from app.services.case_service import get_case_service

DEMO_VENDEDORES = [
    "Leonardo Arévalo",
    "Juan Manuel",
    "Gerardo Santana",
    "Eliezer Chipuli",
    "Sergio Vázquez",
]

DEMO_CASE_SPECS = [
    {
        "cliente": "María González Ruiz",
        "rfc": "GOR850312AB1",
        "seccion": "21",
        "vendedor": "Eliezer Chipuli",
        "order_type": C.ORDER_TYPE_MUEBLE,
        "target": C.ST_EN_REVISION,
        "telegram_id": 100001,
        "comentarios": ["Documentos legibles, pendiente validación de descuento."],
    },
    {
        "cliente": "Roberto Salinas Vega",
        "rfc": "SAV920715CD2",
        "seccion": "14",
        "vendedor": "Leonardo Arévalo",
        "order_type": C.ORDER_TYPE_DINERO,
        "target": C.ST_CORRECCION_SOLICITADA,
        "telegram_id": 100002,
        "comentarios": ["Falta aclarar monto en orden de descuento."],
    },
    {
        "cliente": "Carmen Ruiz Mendoza",
        "rfc": "RUM880201EF3",
        "seccion": "21",
        "vendedor": "Gerardo Santana",
        "order_type": C.ORDER_TYPE_MUEBLE,
        "target": C.ST_ENVIADO_A_COMPULSA,
        "telegram_id": 100003,
        "comentarios": ["Autorización y sindicato generados correctamente."],
    },
    {
        "cliente": "Luis Mendoza Herrera",
        "rfc": "MEH950408GH4",
        "seccion": "08",
        "vendedor": "Juan Manuel",
        "order_type": C.ORDER_TYPE_MUEBLE,
        "target": C.ST_EN_COMPRAS,
        "telegram_id": 100004,
        "comentarios": ["Compulsa realizada, listo para compra Elizondo."],
    },
    {
        "cliente": "Ana Delgado Torres",
        "rfc": "DET870622IJ5",
        "seccion": "14",
        "vendedor": "Sergio Vázquez",
        "order_type": C.ORDER_TYPE_MUEBLE,
        "target": C.ST_FINALIZADO,
        "telegram_id": 100005,
        "comentarios": ["Compra Elizondo registrada, vendedor notificado."],
    },
]


def seed_if_empty() -> None:
    if settings.DEMO_MODE:
        svc = get_case_service()
        if not svc.repo.list_all():
            seed_demo_data(force=False)


def seed_demo_data(*, force: bool = False) -> dict:
    """Crea dataset demo. Con force=True reinicia casos."""
    repo = get_case_repository()
    svc = get_case_service()

    if repo.list_all() and not force:
        return {
            "status": "skipped",
            "message": "Ya existen casos. Use ?force=true para reiniciar.",
            "total": len(repo.list_all()),
        }

    if force:
        _reset_cases(repo)

    created = []
    for spec in DEMO_CASE_SPECS:
        case = _create_case_at_target(svc, spec)
        created.append({
            "folio": case["public_id"],
            "cliente": case["cliente"],
            "estado": case["estado"],
            "vendedor": case["vendedor"],
        })

    return {
        "status": "ok",
        "demo_mode": settings.DEMO_MODE,
        "vendedores": DEMO_VENDEDORES,
        "casos_creados": len(created),
        "casos": created,
    }


def _reset_cases(repo) -> None:
    repo._cases = {}
    repo._counter = 0
    repo._save()


def _auth_data(spec: dict) -> dict:
    hoy = datetime.now().strftime("%d/%m/%Y")
    monto = 28500.0 if spec["order_type"] == C.ORDER_TYPE_MUEBLE else 15000.0
    return {
        "telefono": "8181234567",
        "fecha": hoy,
        "semana": 25,
        "inicio": hoy,
        "plazo": 72,
        "monto_total": monto,
        "rfc": spec["rfc"],
        "observaciones": "Demo GAMAN",
        "productos": [{"descripcion": "Paquete demo", "cantidad": 1, "precio": monto}],
    }


def _docs_for(order_type: str) -> dict[str, bytes]:
    docs = {
        C.DOC_PEDIDO: _img("PEDIDO DEMO"),
        C.DOC_ORDEN_DESCUENTO: _img("ORDEN DESCUENTO DEMO"),
    }
    if order_type == C.ORDER_TYPE_DINERO:
        docs[C.DOC_CARATULA_BANCARIA] = _img("CARATULA BANCO DEMO")
    return docs


def _create_case_at_target(svc, spec: dict) -> dict:
    case = svc.capturar_pedido(
        cliente=spec["cliente"],
        order_type=spec["order_type"],
        vendedor=spec["vendedor"],
        documentos=_docs_for(spec["order_type"]),
        semana=25,
        seller_telegram_chat_id=spec.get("telegram_id"),
    )
    case_id = case["id"]
    case = svc.finalizar_captura(case_id, "Demo Seed")

    extras = {
        "rfc": spec["rfc"],
        "seccion": spec["seccion"],
        "comentarios": spec.get("comentarios", []),
        "sharepoint_path": f"GAMAN/02_PEDIDOS/{case['semana']}/{spec['vendedor']}/{spec['cliente']}",
    }
    svc.repo.update(case_id, {**case, **extras})
    case = svc.repo.get(case_id)

    target = spec["target"]
    auth = _auth_data(spec)

    if target == C.ST_PENDIENTE_REVISION:
        return case

    svc.iniciar_revision(case_id, "Sistemas Demo")
    case = svc.repo.get(case_id)

    if target == C.ST_EN_REVISION:
        return _finalize_extras(svc, case_id, extras)

    if target == C.ST_CORRECCION_SOLICITADA:
        svc.solicitar_correccion(case_id, "Sistemas Demo", "Corregir orden de descuento — demo")
        return _finalize_extras(svc, case_id, extras)

    svc.aprobar(case_id, "Sistemas Demo", auth)
    case = svc.repo.get(case_id)

    if target == C.ST_ENVIADO_A_COMPULSA:
        return _finalize_extras(svc, case_id, extras)

    svc.compulsar(case_id, "Recepción Demo", "Compulsa demo OK")
    case = svc.repo.get(case_id)

    if target == C.ST_EN_COMPRAS:
        return _finalize_extras(svc, case_id, extras)

    svc.registrar_compra(
        case_id, "Compras Demo",
        proveedor="Elizondo",
        numero_pedido="ELZ-DEMO-001",
        observaciones="Compra demo presentación",
    )
    return _finalize_extras(svc, case_id, extras)


def _finalize_extras(svc, case_id: int, extras: dict) -> dict:
    case = svc.repo.get(case_id)
    svc.repo.update(case_id, {**case, **extras})
    return svc.repo.get(case_id)


def _img(label: str) -> bytes:
    import io

    from PIL import Image, ImageDraw

    img = Image.new("RGB", (400, 200), color=(230, 240, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 80), label, fill=(30, 60, 120))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()