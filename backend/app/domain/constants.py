"""Constantes de dominio — alineadas con telegram_bot_REFERENCIA y flujo GAMAN."""

# Tipos de caso
CASE_TYPE_PEDIDO = "pedido"
CASE_TYPE_REVISION = "revision"

# Tipos de venta (telegram: mueble / prestamo → GAMAN: mueble / dinero)
ORDER_TYPE_MUEBLE = "mueble"
ORDER_TYPE_DINERO = "dinero"
ORDER_TYPE_PRESTAMO = "prestamo"  # alias legacy

# Documentos de pedido
DOC_PEDIDO = "pedido"
DOC_ORDEN_DESCUENTO = "orden_descuento"
DOC_CARATULA_BANCARIA = "caratula_bancaria"
DOC_AUTORIZACION = "autorizacion"
DOC_SINDICATO = "sindicato"

# Documentos de revisión
DOC_REVISION_EVIDENCIA = "revision_evidencia"
DOC_REVISION_DICTAMEN = "revision_dictamen"

# Estados oficiales GAMAN (máquina de estados unificada para pedidos)
ST_CAPTURADO = "CAPTURADO"
ST_PENDIENTE_REVISION = "PENDIENTE_REVISION"
ST_EN_REVISION = "EN_REVISION"
ST_CORRECCION_SOLICITADA = "CORRECCION_SOLICITADA"
ST_APROBADO = "APROBADO"
ST_RECHAZADO = "RECHAZADO"
ST_AUTORIZACION_GENERADA = "AUTORIZACION_GENERADA"
ST_SINDICATO_GENERADO = "SINDICATO_GENERADO"
ST_ENVIADO_A_COMPULSA = "ENVIADO_A_COMPULSA"
ST_COMPULSADO = "COMPULSADO"
ST_EN_COMPRAS = "EN_COMPRAS"
ST_COMPRADO = "COMPRADO"
ST_NOTIFICADO_VENDEDOR = "NOTIFICADO_VENDEDOR"
ST_FINALIZADO = "FINALIZADO"

ALL_ESTADOS = [
    ST_CAPTURADO,
    ST_PENDIENTE_REVISION,
    ST_EN_REVISION,
    ST_CORRECCION_SOLICITADA,
    ST_APROBADO,
    ST_RECHAZADO,
    ST_AUTORIZACION_GENERADA,
    ST_SINDICATO_GENERADO,
    ST_ENVIADO_A_COMPULSA,
    ST_COMPULSADO,
    ST_EN_COMPRAS,
    ST_COMPRADO,
    ST_NOTIFICADO_VENDEDOR,
    ST_FINALIZADO,
]

# Transiciones permitidas
TRANSICIONES: dict[str, list[str]] = {
    ST_CAPTURADO: [ST_PENDIENTE_REVISION],
    ST_PENDIENTE_REVISION: [ST_EN_REVISION, ST_RECHAZADO],
    ST_EN_REVISION: [ST_APROBADO, ST_CORRECCION_SOLICITADA, ST_RECHAZADO],
    ST_CORRECCION_SOLICITADA: [ST_PENDIENTE_REVISION],
    ST_APROBADO: [ST_AUTORIZACION_GENERADA],
    ST_AUTORIZACION_GENERADA: [ST_SINDICATO_GENERADO],
    ST_SINDICATO_GENERADO: [ST_ENVIADO_A_COMPULSA],
    ST_ENVIADO_A_COMPULSA: [ST_COMPULSADO],
    ST_COMPULSADO: [ST_EN_COMPRAS],
    ST_EN_COMPRAS: [ST_COMPRADO],
    ST_COMPRADO: [ST_NOTIFICADO_VENDEDOR],
    ST_NOTIFICADO_VENDEDOR: [ST_FINALIZADO],
}

# Grupos operativos
ESTADOS_SISTEMAS = [ST_PENDIENTE_REVISION, ST_EN_REVISION, ST_CORRECCION_SOLICITADA]
ESTADOS_COMPULSA = [ST_ENVIADO_A_COMPULSA]
ESTADOS_COMPRAS = [ST_EN_COMPRAS, ST_COMPULSADO]

PLAZOS_REFINANCIAMIENTO = [72, 60, 46, 34]

VENDEDORES = [
    "Sergio Valadez", "Victor Vega", "Sergio Vazquez", "Eliezer Chipuli",
    "Gerardo Santana", "Juan Manuel", "Leonardo Arevalo",
    "Carlos Mendoza", "Ana Torres", "Patricia Gómez", "Luis Rivera",
]

TIPOS_VENTA = ["Nueva", "Paralela", "Reactivada", "Reestructurada"]
PROVEEDORES = ["Elizondo", "Otro"]

SUCURSAL_DEFAULT = "NUEVO LEON"
ELABORO_DEFAULT = "Elaboro: Erick Lope"

# SharePoint subcarpetas (telegram_bot_REFERENCIA)
SP_FOLDER_REVISIONES = "01_REVISIONES"
SP_FOLDER_PEDIDOS = "02_PEDIDOS"
SP_FOLDER_AUTORIZACIONES = "03_AUTORIZACIONES"
SP_FOLDER_COMPULSA = "04_COMPULSA"


def normalize_order_type(order_type: str) -> str:
    ot = (order_type or "").lower().strip()
    if ot in (ORDER_TYPE_DINERO, ORDER_TYPE_PRESTAMO, "préstamo", "prestamo"):
        return ORDER_TYPE_DINERO
    return ORDER_TYPE_MUEBLE


def required_doc_types_for_order(order_type: str) -> list[str]:
    if normalize_order_type(order_type) == ORDER_TYPE_MUEBLE:
        return [DOC_ORDEN_DESCUENTO, DOC_PEDIDO]
    return [DOC_PEDIDO, DOC_ORDEN_DESCUENTO, DOC_CARATULA_BANCARIA]


def doc_type_label(doc_type: str) -> str:
    return {
        DOC_PEDIDO: "Pedido",
        DOC_ORDEN_DESCUENTO: "Orden de descuento",
        DOC_CARATULA_BANCARIA: "Carátula banco",
        DOC_AUTORIZACION: "Autorización",
        DOC_SINDICATO: "Hoja sindicato",
        DOC_REVISION_EVIDENCIA: "Evidencia revisión",
        DOC_REVISION_DICTAMEN: "Dictamen revisión",
    }.get(doc_type, doc_type)


def checklist_lines(order_type: str, present: set[str]) -> list[dict]:
    return [
        {
            "tipo": dt,
            "label": doc_type_label(dt),
            "completo": dt in present,
        }
        for dt in required_doc_types_for_order(order_type)
    ]


def can_transition(current: str, new: str) -> bool:
    return new in TRANSICIONES.get(current, [])


def sharepoint_subfolder_for_doc(doc_type: str) -> str:
    if doc_type in (DOC_AUTORIZACION, DOC_SINDICATO):
        return SP_FOLDER_AUTORIZACIONES
    if doc_type in (DOC_REVISION_EVIDENCIA, DOC_REVISION_DICTAMEN):
        return SP_FOLDER_REVISIONES
    return SP_FOLDER_PEDIDOS