from datetime import datetime
from pathlib import Path

from app.core.config import settings
from app.services.autorizaciones_excel import generar_autorizacion_bytes
from app.services.refinanciamiento_calc import calcular_resumen_refinanciamiento
from app.services.sindicato_excel import generar_sindicato_bytes
from app.services.talon_calculator import calcular_revision_talon
from app.services.talon_excel import generar_excel_revision_bytes
from app.services.talon_mensaje import generar_mensaje_vendedor

_COUNTER = 100
_TALONES: dict[int, dict] = {}


def _next_id() -> int:
    global _COUNTER
    _COUNTER += 1
    return _COUNTER


def _next_folio() -> str:
    year = datetime.now().year
    count = len(_TALONES) + 1
    return f"REV-{year}-{count:04d}"


def _codigos_from_flat(codigos: dict[str, float]) -> dict:
    return {k: {"importe": v} for k, v in codigos.items()}


def _default_facturas(revision: dict, descuento_actual: float) -> list[dict]:
    liquidez = max(revision["liquidez_final"], 0)
    vta = max(revision["ingresos"] * 4, 50000)
    saldo = round(vta * 0.45, 2)
    abono = round(descuento_actual, 2) if descuento_actual else round(vta / 72, 2)
    return [{
        "FACT": "AUTO-001",
        "VTA": vta,
        "SALDO": saldo,
        "ABONO": abono,
        "INCLUIR": True,
        "QNAS TOMADAS A CUENTA": 0,
        "EN COBRO": "",
    }]


def crear_revision(payload: dict) -> dict:
    codigos = _codigos_from_flat(payload.get("codigos", {}))
    cuentas = [c.model_dump() if hasattr(c, "model_dump") else c for c in payload.get("cuentas_terminadas", [])]

    revision = calcular_revision_talon(
        codigos_extraidos=codigos,
        descuentos_talon=float(payload["descuentos_talon"]),
        abono_extra=float(payload.get("abono_extra", 0)),
        programado=float(payload.get("programado", 0)),
        cuentas_terminadas=cuentas,
    )

    facturas_raw = payload.get("facturas", [])
    facturas = []
    for f in facturas_raw:
        item = f.model_dump(by_alias=True) if hasattr(f, "model_dump") else dict(f)
        if "QNAS TOMADAS A CUENTA" not in item and "QNAS_TOMADAS_A_CUENTA" in item:
            item["QNAS TOMADAS A CUENTA"] = item.pop("QNAS_TOMADAS_A_CUENTA")
        facturas.append(item)

    descuento_actual = revision["descuentos"]
    aumento = payload.get("aumento_descuento")
    if aumento is None:
        aumento = max(revision["liquidez_final"], 0)

    if not facturas:
        facturas = _default_facturas(revision, descuento_actual)

    resumen = calcular_resumen_refinanciamiento(facturas, aumento)
    sim_72 = resumen["simulacion"].get(72, {})
    descuento_nuevo = resumen["total_abono_nuevo"]
    venta_posible = sim_72.get("VENTA POSIBLE", 0.0)

    datos = {
        "nombre": payload["cliente"],
        "rfc": payload["rfc"],
        "fecha_pago": payload.get("fecha_pago", ""),
    }

    mensaje = generar_mensaje_vendedor(
        datos=datos,
        revision=revision,
        tiene_programado=payload.get("tiene_programado", "No"),
    )

    talon_id = _next_id()
    folio = _next_folio()
    record = {
        "id": talon_id,
        "folio": folio,
        "cliente": payload["cliente"],
        "rfc": payload["rfc"],
        "seccion": payload.get("seccion", "21"),
        "vendedor": payload["vendedor"],
        "descuento_actual": descuento_actual,
        "descuento_nuevo": descuento_nuevo,
        "venta_posible": venta_posible,
        "estado": "en_revision",
        "qna": payload.get("qna", "09-2026"),
        "tiene_programado": payload.get("tiene_programado", "No"),
        "revision": revision,
        "resumen_refinanciamiento": resumen,
        "mensaje_vendedor": mensaje,
        "datos": datos,
        "archivos": {},
        "autorizacion": None,
    }
    _TALONES[talon_id] = record
    return record


def list_talones() -> list[dict]:
    from app.services.demo_data import TALONES

    demo = [{**t, "mensaje_generado": False, "revision_excel": False,
             "autorizacion_excel": False, "sindicato_excel": False} for t in TALONES]
    stored = [_to_summary(t) for t in _TALONES.values()]
    return demo + stored


def get_talon(talon_id: int) -> dict | None:
    if talon_id in _TALONES:
        return _TALONES[talon_id]
    from app.services.demo_data import TALONES
    for t in TALONES:
        if t["id"] == talon_id:
            return {**t, "revision": None, "mensaje_vendedor": None, "archivos": {}, "autorizacion": None}
    return None


def _to_summary(record: dict) -> dict:
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
    }


def generar_revision_excel(talon_id: int) -> dict | None:
    record = _TALONES.get(talon_id)
    if not record:
        return None

    content, filename = generar_excel_revision_bytes(
        datos=record["datos"],
        revision=record["revision"],
        mensaje_vendedor=record["mensaje_vendedor"],
        promotor=record["vendedor"],
        qna=record.get("qna", "09-2026"),
    )

    out_dir = Path(settings.STORAGE_PATH) / "generated" / "revisiones" / record["folio"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    out_path.write_bytes(content)

    record["archivos"]["revision"] = str(out_path)
    record["estado"] = "revision_generada"
    return {"path": str(out_path), "filename": filename}


def generar_autorizacion(talon_id: int, auth_data: dict) -> dict | None:
    record = _TALONES.get(talon_id)
    if not record:
        return None

    data = {
        **auth_data,
        "cliente": record["cliente"],
        "rfc": record["rfc"],
        "vendedor": record["vendedor"],
    }

    auth_bytes, auth_name = generar_autorizacion_bytes(data)
    sind_bytes, sind_name = generar_sindicato_bytes(data)

    out_dir = Path(settings.STORAGE_PATH) / "generated" / "autorizaciones" / record["folio"]
    out_dir.mkdir(parents=True, exist_ok=True)

    auth_path = out_dir / auth_name
    sind_path = out_dir / sind_name
    auth_path.write_bytes(auth_bytes)
    sind_path.write_bytes(sind_bytes)

    record["autorizacion"] = data
    record["archivos"]["autorizacion"] = str(auth_path)
    record["archivos"]["sindicato"] = str(sind_path)
    record["estado"] = "autorizado"
    return {
        "autorizacion": {"path": str(auth_path), "filename": auth_name},
        "sindicato": {"path": str(sind_path), "filename": sind_name},
    }


def get_archivo_path(talon_id: int, tipo: str) -> Path | None:
    record = _TALONES.get(talon_id)
    if not record:
        return None
    path = record.get("archivos", {}).get(tipo)
    if not path:
        return None
    p = Path(path)
    return p if p.exists() else None