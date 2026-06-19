from app.domain.constants import PLAZOS_REFINANCIAMIENTO


def _to_float(valor) -> float:
    if valor is None:
        return 0.0
    if isinstance(valor, (int, float)):
        return float(valor)
    try:
        return float(
            str(valor)
            .replace("$", "")
            .replace(",", "")
            .replace("%", "")
            .strip()
        )
    except (TypeError, ValueError):
        return 0.0


def calcular_facturas_refinanciamiento(facturas: list[dict]) -> list[dict]:
    resultado = []
    for fila in facturas:
        fact = str(fila.get("FACT", "") or "").strip()
        vta = _to_float(fila.get("VTA"))
        saldo = _to_float(fila.get("SALDO"))
        abono = _to_float(fila.get("ABONO"))
        qnas = _to_float(fila.get("QNAS TOMADAS A CUENTA"))
        en_cobro = str(fila.get("EN COBRO", "") or "").strip()
        incluir = fila.get("INCLUIR")

        activa = bool(fact or en_cobro or vta or saldo or abono or qnas)
        pagado = round(vta - saldo, 2) if vta > 0 else 0.0
        abono_qnas = round(qnas * abono, 2)
        saldo_pendiente = round(saldo - abono_qnas, 2)
        porcentaje = round((pagado / vta) * 100, 6) if vta > 0 else 0.0

        puede = ""
        estatus = ""
        motivo = ""
        if activa:
            if saldo > vta:
                puede = "NO"
                estatus = "REVISAR SALDO"
                motivo = "SALDO mayor que VTA"
            elif porcentaje >= 40:
                puede = "SI"
                estatus = "APTA"
            else:
                puede = "NO"
                estatus = "NO APTA"
                motivo = "Menos del 40% pagado"

        if incluir is None:
            incluir = puede == "SI"

        resultado.append({
            **fila,
            "FACT": fact,
            "VTA": vta,
            "SALDO": saldo,
            "ABONO": abono,
            "QNAS TOMADAS A CUENTA": qnas,
            "EN COBRO": en_cobro,
            "PAGADO": pagado,
            "ABONO DE QUINCENAS CONS": abono_qnas,
            "SALDO PENDIENTE": saldo_pendiente,
            "PORCENTAJE PAGADO": porcentaje,
            "REFINANCIAMIENTO": pagado,
            "PUEDE REFINANCIAR": puede,
            "ESTATUS": estatus,
            "MOTIVO": motivo,
            "INCLUIR": bool(incluir),
        })
    return resultado


def calcular_resumen_refinanciamiento(
    facturas: list[dict],
    aumento_descuento: float,
) -> dict:
    calculadas = calcular_facturas_refinanciamiento(facturas)
    incluidas = [f for f in calculadas if f.get("INCLUIR")]

    def total(columna: str) -> float:
        return round(sum(_to_float(f.get(columna)) for f in incluidas), 2)

    aumento = _to_float(aumento_descuento)
    abono_ref = total("ABONO")
    total_abono_nuevo = round(abono_ref + aumento, 2)
    total_saldo_pendiente = total("SALDO PENDIENTE")

    simulacion = {}
    for plazo in PLAZOS_REFINANCIAMIENTO:
        total_saldo_nuevo = round(total_abono_nuevo * plazo, 2)
        venta_posible = round(total_saldo_nuevo - total_saldo_pendiente, 2)
        simulacion[plazo] = {
            "SALDO PENDIENTE": total_saldo_pendiente,
            "VENTA POSIBLE": venta_posible,
            "TOTAL SALDO NUEVO": total_saldo_nuevo,
            "DESCUENTO NUEVO": total_abono_nuevo,
            "TOTAL ADEUDO CLIENTE": total_saldo_nuevo,
        }

    return {
        "total_vta": total("VTA"),
        "total_pagado": total("PAGADO"),
        "total_saldo_pendiente": total_saldo_pendiente,
        "abono_ref": abono_ref,
        "aumento_descuento": aumento,
        "total_abono_nuevo": total_abono_nuevo,
        "simulacion": simulacion,
        "facturas": calculadas,
    }