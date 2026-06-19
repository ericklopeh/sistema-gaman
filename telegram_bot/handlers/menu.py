"""Enruta botones del teclado a comandos."""

from telegram import Update
from telegram.ext import ContextTypes

from handlers.consultas import estatus, mis_pedidos, mis_ventas_hoy
from handlers.nuevo_pedido import nuevo_pedido_start
from services.constants import MENU_LABELS

_LABEL_TO_HANDLER = {
    MENU_LABELS["nuevo_pedido"][0].lower(): nuevo_pedido_start,
    MENU_LABELS["mis_pedidos"][0].lower(): mis_pedidos,
    MENU_LABELS["ventas_hoy"][0].lower(): mis_ventas_hoy,
    MENU_LABELS["estatus"][0].lower(): estatus,
    # aliases sin emoji
    "nuevo pedido": nuevo_pedido_start,
    "mis pedidos": mis_pedidos,
    "mis ventas de hoy": mis_ventas_hoy,
    "consultar estatus": estatus,
}


async def menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int | None:
    text = (update.message.text or "").strip().lower()
    handler = _LABEL_TO_HANDLER.get(text)
    if not handler:
        return None
    result = await handler(update, context)
    return result if handler is nuevo_pedido_start else None