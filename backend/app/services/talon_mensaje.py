def formato_moneda(valor: float) -> str:
    if valor < 0:
        return f"-${abs(valor):,.2f}"
    return f"${valor:,.2f}"


def cuentas_por_tipo(cuentas: list[dict], sumar_a_liquidez: bool) -> list[dict]:
    return [c for c in cuentas if bool(c.get("sumar_a_liquidez", False)) == sumar_a_liquidez]


def lineas_cuentas_para_mensaje(cuentas: list[dict]) -> list[str]:
    lineas = []
    for cuenta in cuentas:
        qna = str(cuenta.get("qna_termina", "")).strip() or "Sin QNA"
        monto = float(cuenta.get("saldo_liberado", 0) or 0)
        observacion = str(cuenta.get("observacion", "")).strip()
        linea = f"- QNA {qna}: {formato_moneda(monto)}"
        if observacion:
            linea += f" ({observacion})"
        lineas.append(linea)
    return lineas


def generar_resultado_liquidez(revision: dict, tiene_programado: str) -> str:
    liquidez_final = revision["liquidez_final"]
    programado = revision["programado"]
    cuentas_terminadas = revision.get("cuentas_terminadas", [])

    if cuentas_terminadas:
        if (
            revision.get("liquidez_talon", 0) < 0
            and revision.get("liquidez_antes_liberacion", 0) < 0
            and liquidez_final > 0
            and revision.get("total_saldo_liberado", 0) > 0
        ):
            resultado = (
                "Tenía sobregiro, pero queda con liquidez por cuentas terminadas: "
                f"{formato_moneda(liquidez_final)}."
            )
        elif liquidez_final > 0:
            resultado = f"Tiene liquidez disponible de {formato_moneda(liquidez_final)}."
        elif liquidez_final < 0:
            resultado = f"No tiene liquidez. Sobregiro final de {formato_moneda(liquidez_final)}."
        else:
            resultado = "Queda sin liquidez disponible ni sobregiro."

        if tiene_programado == "Sí" and programado > 0:
            resultado += f" Tiene un programado por {formato_moneda(programado)}."
        return resultado

    if liquidez_final > 0:
        if tiene_programado == "Sí" and programado > 0:
            return (
                f"Tiene liquidez de {formato_moneda(liquidez_final)}. "
                f"Tiene un programado por {formato_moneda(programado)}."
            )
        return f"Tiene liquidez de {formato_moneda(liquidez_final)}."

    if liquidez_final < 0 and tiene_programado == "Sí" and programado > 0:
        return (
            f"No tiene liquidez. Tiene un sobregiro de: {formato_moneda(liquidez_final)}. "
            f"Tiene un programado por {formato_moneda(programado)}."
        )

    if liquidez_final < 0:
        return f"No tiene liquidez. Tiene un sobregiro de: {formato_moneda(liquidez_final)}."

    return "No tiene liquidez disponible."


def generar_mensaje_vendedor(datos: dict, revision: dict, tiene_programado: str) -> str:
    nombre = datos["nombre"]
    rfc = datos["rfc"]
    resultado_liquidez = generar_resultado_liquidez(revision, tiene_programado)
    cuentas = revision.get("cuentas_terminadas", [])

    if not cuentas:
        return f"""Se realizó la revisión del talón correspondiente al cliente:

Cliente: {nombre}
RFC: {rfc}

Resultado de la revisión:
{resultado_liquidez}"""

    cuentas_liberadas = cuentas_por_tipo(cuentas, True)
    cuentas_observadas = cuentas_por_tipo(cuentas, False)
    liquidez_talon = revision.get("liquidez_talon", 0)
    estado_talon = (
        f"liquidez de {formato_moneda(liquidez_talon)}"
        if liquidez_talon >= 0
        else f"sobregiro de {formato_moneda(liquidez_talon)}"
    )
    bloques = [
        f"El cliente {nombre} presenta {estado_talon} en talón.",
        f"RFC: {rfc}",
    ]

    if cuentas_liberadas:
        bloques.append(
            "Adicionalmente, cuenta con saldos liberados por cuentas que terminan:\n"
            + "\n".join(lineas_cuentas_para_mensaje(cuentas_liberadas))
            + "\n\nTotal liberado: "
            + formato_moneda(revision.get("total_saldo_liberado", 0))
        )

    if cuentas_observadas:
        bloques.append(
            "Cuentas registradas solo como observación, sin sumar a liquidez:\n"
            + "\n".join(lineas_cuentas_para_mensaje(cuentas_observadas))
            + "\n\nTotal solo observado: "
            + formato_moneda(revision.get("total_solo_observado", 0))
        )

    bloques.append(f"Considerando lo anterior, {resultado_liquidez.lower()}")
    return "\n\n".join(bloques)