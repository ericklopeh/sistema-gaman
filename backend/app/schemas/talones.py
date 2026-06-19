from pydantic import BaseModel, Field


class CodigoIngreso(BaseModel):
    codigo: str
    importe: float = 0.0


class CuentaTerminada(BaseModel):
    qna_termina: str = ""
    saldo_liberado: float = 0.0
    sumar_a_liquidez: bool = True
    observacion: str = ""


class FacturaRefinanciamiento(BaseModel):
    FACT: str = ""
    VTA: float = 0.0
    SALDO: float = 0.0
    ABONO: float = 0.0
    INCLUIR: bool | None = None
    QNAS_TOMADAS_A_CUENTA: float = Field(0.0, alias="QNAS TOMADAS A CUENTA")
    EN_COBRO: str = Field("", alias="EN COBRO")

    model_config = {"populate_by_name": True}


class RevisionCreate(BaseModel):
    cliente: str
    rfc: str
    seccion: str = "21"
    vendedor: str
    qna: str = "09-2026"
    fecha_pago: str = ""
    descuentos_talon: float
    abono_extra: float = 0.0
    programado: float = 0.0
    tiene_programado: str = "No"
    codigos: dict[str, float] = Field(default_factory=dict)
    cuentas_terminadas: list[CuentaTerminada] = Field(default_factory=list)
    facturas: list[FacturaRefinanciamiento] = Field(default_factory=list)
    aumento_descuento: float | None = None


class ProductoAutorizacion(BaseModel):
    producto: str = ""
    producto_secundario: str = ""
    trans_credito: float | None = None
    credito: float | None = None
    precio_venta: float | None = None
    descuento: float | None = None
    tipo_vta: str = "Nueva"


class AutorizacionCreate(BaseModel):
    telefono: str = ""
    fecha: str
    folio: str
    semana: int
    inicio: str
    plazo: int = 72
    monto_total: float | None = None
    observaciones: str = ""
    productos: list[ProductoAutorizacion] = Field(default_factory=list)


class TalonSummary(BaseModel):
    id: int
    folio: str
    cliente: str
    rfc: str
    seccion: str
    vendedor: str
    descuento_actual: float
    descuento_nuevo: float
    venta_posible: float
    estado: str
    mensaje_generado: bool = False
    revision_excel: bool = False
    autorizacion_excel: bool = False
    sindicato_excel: bool = False


class TalonDetail(TalonSummary):
    revision: dict
    mensaje_vendedor: str | None = None
    resumen_refinanciamiento: dict | None = None
    archivos: dict[str, str] = Field(default_factory=dict)
    autorizacion: AutorizacionCreate | None = None