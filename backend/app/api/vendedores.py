from fastapi import APIRouter, HTTPException

from app.services.case_service import get_case_service

router = APIRouter(prefix="/api/vendedores", tags=["vendedores"])


@router.get("/{telegram_id}/pedidos")
def mis_pedidos(telegram_id: int) -> list[dict]:
    svc = get_case_service()
    cases = svc.pedidos_por_telegram(telegram_id)
    return [
        {
            "id": c["id"],
            "folio": c["public_id"],
            "official_folio": c.get("official_folio"),
            "cliente": c["cliente"],
            "order_type": c.get("order_type"),
            "estado": c.get("estado"),
            "vendedor": c.get("vendedor"),
            "created_at": c.get("created_at"),
            "updated_at": c.get("updated_at"),
            "checklist": svc.get_checklist(c),
        }
        for c in cases
    ]


@router.get("/{telegram_id}/ventas-hoy")
def ventas_hoy(telegram_id: int) -> dict:
    svc = get_case_service()
    ventas = svc.ventas_hoy_por_telegram(telegram_id)
    return {
        "telegram_id": telegram_id,
        "fecha": __import__("datetime").date.today().isoformat(),
        "total": len(ventas),
        "ventas": [
            {
                "folio": c.get("public_id"),
                "cliente": c.get("cliente"),
                "tipo": c.get("order_type"),
                "order_type": c.get("order_type"),
                "estado": c.get("estado"),
                "proveedor": (c.get("compra") or {}).get("proveedor"),
                "numero_pedido": (c.get("compra") or {}).get("numero_pedido"),
                "fecha": (c.get("compra") or {}).get("fecha") or c.get("updated_at"),
            }
            for c in ventas
        ],
    }


@router.get("/{telegram_id}/estatus")
def estatus_vendedor(telegram_id: int) -> dict:
    return get_case_service().estatus_por_telegram(telegram_id)


@router.get("/{telegram_id}/pendientes")
def mis_pendientes(telegram_id: int) -> list[dict]:
    from app.domain import constants as C

    svc = get_case_service()
    pendientes_estados = {
        C.ST_CAPTURADO,
        C.ST_PENDIENTE_REVISION,
        C.ST_EN_REVISION,
        C.ST_CORRECCION_SOLICITADA,
        C.ST_ENVIADO_A_COMPULSA,
        C.ST_EN_COMPRAS,
    }
    cases = [
        c for c in svc.pedidos_por_telegram(telegram_id)
        if c.get("estado") in pendientes_estados
    ]
    return [
        {
            "folio": c.get("public_id"),
            "cliente": c.get("cliente"),
            "estado": c.get("estado"),
            "order_type": c.get("order_type"),
            "checklist": svc.get_checklist(c),
        }
        for c in cases
    ]