def obtener_importe(codigos: dict, codigo: str, equivalencias: list[str] | None = None) -> float:
    equivalencias = equivalencias or []
    for posible in [codigo, *equivalencias]:
        if posible in codigos:
            return float(codigos[posible].get("importe", codigos[posible]) if isinstance(codigos[posible], dict) else codigos[posible])
    return 0.0


def filtrar_codigos_revision(codigos_extraidos: dict) -> dict:
    return {
        "E4": obtener_importe(codigos_extraidos, "E4"),
        "E3": obtener_importe(codigos_extraidos, "E3"),
        "Q": obtener_importe(codigos_extraidos, "Q", ["A2"]),
        "CP": obtener_importe(codigos_extraidos, "CP"),
        "7": obtener_importe(codigos_extraidos, "7", ["07"]),
        "CT": obtener_importe(codigos_extraidos, "CT"),
        "7B": obtener_importe(codigos_extraidos, "7B"),
        "E9": obtener_importe(codigos_extraidos, "E9"),
        "SG": obtener_importe(codigos_extraidos, "SG"),
        "O1": obtener_importe(codigos_extraidos, "O1", ["01"]),
        "DC": obtener_importe(codigos_extraidos, "DC"),
    }


def calcular_ingresos_revision(codigos_revision: dict) -> float:
    codigos_ingresos = ["E4", "E3", "Q", "CP", "7", "CT", "7B", "E9", "SG"]
    total = sum(codigos_revision.get(codigo, 0) for codigo in codigos_ingresos)
    return round(total, 2)


def calcular_revision_talon(
    codigos_extraidos: dict,
    descuentos_talon: float,
    abono_extra: float = 0,
    programado: float = 0,
    cuentas_terminadas: list[dict] | None = None,
) -> dict:
    cuentas_terminadas = cuentas_terminadas or []
    codigos_revision = filtrar_codigos_revision(codigos_extraidos)

    ingresos = calcular_ingresos_revision(codigos_revision)
    saldo_100 = ingresos - descuentos_talon
    total_para_venta_70 = ingresos * 0.70
    saldo_70 = total_para_venta_70 - descuentos_talon

    total_saldo_liberado = sum(
        float(cuenta.get("saldo_liberado", 0) or 0)
        for cuenta in cuentas_terminadas
        if cuenta.get("sumar_a_liquidez", False)
    )
    total_solo_observado = sum(
        float(cuenta.get("saldo_liberado", 0) or 0)
        for cuenta in cuentas_terminadas
        if not cuenta.get("sumar_a_liquidez", False)
    )

    liquidez_talon = saldo_100
    liquidez_antes_liberacion = liquidez_talon + abono_extra - programado
    liquidez_final = liquidez_antes_liberacion + total_saldo_liberado

    return {
        "codigos_revision": codigos_revision,
        "ingresos": round(ingresos, 2),
        "descuentos": round(descuentos_talon, 2),
        "saldo_100": round(saldo_100, 2),
        "total_para_venta_70": round(total_para_venta_70, 2),
        "saldo_70": round(saldo_70, 2),
        "saldo_mas_abonos_70": round(saldo_70 - programado, 2),
        "saldo_mas_abono_100": round(saldo_100 - programado, 2),
        "abono_extra": round(abono_extra, 2),
        "programado": round(programado, 2),
        "cuentas_terminadas": cuentas_terminadas,
        "liquidez_talon": round(liquidez_talon, 2),
        "total_saldo_liberado": round(total_saldo_liberado, 2),
        "total_solo_observado": round(total_solo_observado, 2),
        "liquidez_antes_liberacion": round(liquidez_antes_liberacion, 2),
        "liquidez_final": round(liquidez_final, 2),
    }