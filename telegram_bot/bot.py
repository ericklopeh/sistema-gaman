#!/usr/bin/env python3
"""Bot Telegram delgado — cliente HTTP de Sistema GAMAN."""

import logging
import sys

from telegram.ext import (
    Application,
    CommandHandler,
    ConversationHandler,
    MessageHandler,
    filters,
)

from config import settings
from handlers import (
    CLIENTE,
    FOTO,
    TIPO,
    cancelar,
    estatus,
    foto_invalida,
    mis_pedidos,
    mis_pendientes,
    mis_ventas_hoy,
    nuevo_pedido_start,
    recibir_cliente,
    recibir_foto,
    recibir_tipo,
    start,
)
from handlers.menu import menu_handler
from services.gaman_api import get_gaman_api

logging.basicConfig(
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    level=logging.INFO,
)
log = logging.getLogger("gaman.telegram")


def build_application() -> Application:
    if not settings.TELEGRAM_BOT_TOKEN:
        log.error("TELEGRAM_BOT_TOKEN no configurado — agregue el token en sistema-gaman/.env")
        sys.exit(1)

    app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()

    nuevo_pedido_conv = ConversationHandler(
        entry_points=[
            CommandHandler("nuevo_pedido", nuevo_pedido_start),
            MessageHandler(
                filters.Regex(r"(?i)^📦\s*nuevo pedido$"),
                nuevo_pedido_start,
            ),
        ],
        states={
            CLIENTE: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_cliente)],
            TIPO: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_tipo)],
            FOTO: [
                MessageHandler(filters.PHOTO, recibir_foto),
                MessageHandler(filters.Document.IMAGE, recibir_foto),
                MessageHandler(filters.TEXT & ~filters.COMMAND, foto_invalida),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancelar)],
        allow_reentry=True,
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(nuevo_pedido_conv)
    app.add_handler(CommandHandler("mis_pedidos", mis_pedidos))
    app.add_handler(CommandHandler("mis_pendientes", mis_pendientes))
    app.add_handler(CommandHandler("mis_ventas_hoy", mis_ventas_hoy))
    app.add_handler(CommandHandler("estatus", estatus))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, menu_handler))

    return app


def main() -> None:
    log.info("GAMAN API: %s", settings.GAMAN_API_URL)
    try:
        health = get_gaman_api().health()
        log.info("Backend OK: %s", health.get("status", health))
        horario = get_gaman_api().horario_operativo()
        log.info(
            "Horario: captura_vendedor=%s within_hours=%s",
            horario.get("captura_disponible_vendedor"),
            horario.get("within_hours"),
        )
    except Exception as exc:
        log.warning("Backend no disponible al inicio: %s", exc)

    app = build_application()
    log.info("Bot GAMAN iniciado — polling activo")
    app.run_polling(allowed_updates=["message"], drop_pending_updates=True)


if __name__ == "__main__":
    main()