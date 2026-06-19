from pydantic import BaseModel, Field


class ProductoAutorizacion(BaseModel):
    producto: str = ""
    trans_credito: float | None = None
    credito: float | None = None
    precio_venta: float | None = None
    descuento: float | None = None
    tipo_vta: str = "Nueva"


class AutorizacionAprobar(BaseModel):
    telefono: str = ""
    fecha: str
    semana: int
    inicio: str
    plazo: int = 72
    monto_total: float | None = None
    observaciones: str = ""
    productos: list[ProductoAutorizacion] = Field(default_factory=list)


class CapturaPedido(BaseModel):
    cliente: str
    order_type: str  # mueble | dinero
    vendedor: str
    semana: int | None = None
    seller_telegram_chat_id: int | None = None


class AccionMotivo(BaseModel):
    motivo: str = ""
    usuario: str = "Sistemas GAMAN"


class CompulsaAccion(BaseModel):
    observaciones: str = ""
    usuario: str = "Recepción"


class CompraAccion(BaseModel):
    proveedor: str  # Elizondo | Otro
    numero_pedido: str | None = None
    nombre_proveedor: str | None = None
    observaciones: str = ""
    usuario: str = "Compras"