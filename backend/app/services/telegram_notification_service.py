"""TelegramNotificationService — envío de notificaciones al vendedor vía Bot API."""

import logging
from datetime import datetime

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class TelegramNotificationService:
    def __init__(self, token: str | None = None) -> None:
        self.token = token or settings.TELEGRAM_BOT_TOKEN

    @property
    def is_configured(self) -> bool:
        return bool(self.token)

    def send_message(self, chat_id: int | str, text: str, *, parse_mode: str = "HTML") -> dict:
        if not self.token or not chat_id:
            logger.info("Telegram mock chat_id=%s: %s", chat_id, text[:100])
            return {
                "status": "mock",
                "chat_id": chat_id,
                "mensaje": text,
                "timestamp": datetime.now().isoformat(),
                "error": None if self.token else "token_missing",
            }

        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(url, json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode,
                })
                resp.raise_for_status()
                data = resp.json()
                return {
                    "status": "sent",
                    "chat_id": chat_id,
                    "mensaje": text,
                    "timestamp": datetime.now().isoformat(),
                    "telegram_message_id": data.get("result", {}).get("message_id"),
                }
        except Exception as exc:
            logger.warning("Telegram send failed: %s", exc)
            return {
                "status": "failed",
                "chat_id": chat_id,
                "mensaje": text,
                "timestamp": datetime.now().isoformat(),
                "error": str(exc),
            }

    def notify_compra_realizada(self, case: dict) -> dict:
        compra = case.get("compra") or {}
        folio = case.get("official_folio") or case.get("public_id", "")
        proveedor = compra.get("proveedor", "")
        pedido = compra.get("numero_pedido") or compra.get("nombre_proveedor") or "N/A"
        mensaje = (
            "✅ <b>Compra realizada</b>\n\n"
            f"<b>Folio:</b>\n{folio}\n\n"
            f"<b>Cliente:</b>\n{case.get('cliente', '')}\n\n"
            f"<b>Proveedor:</b>\n{proveedor}\n\n"
            f"<b>Pedido:</b>\n{pedido}\n\n"
            f"<b>Estado:</b>\nCOMPRADO"
        )
        chat_id = case.get("seller_telegram_chat_id")
        return self.send_message(chat_id, mensaje)

    def notify_custom(
        self,
        chat_id: int | str,
        *,
        folio: str,
        cliente: str,
        proveedor: str = "",
        numero_pedido: str = "",
        estado: str = "COMPRADO",
    ) -> dict:
        mensaje = (
            "✅ <b>Compra realizada</b>\n\n"
            f"<b>Folio:</b>\n{folio}\n\n"
            f"<b>Cliente:</b>\n{cliente}\n\n"
            f"<b>Proveedor:</b>\n{proveedor}\n\n"
            f"<b>Pedido:</b>\n{numero_pedido or 'N/A'}\n\n"
            f"<b>Estado:</b>\n{estado}"
        )
        return self.send_message(chat_id, mensaje)


_service: TelegramNotificationService | None = None


def get_telegram_notification_service() -> TelegramNotificationService:
    global _service
    if _service is None:
        _service = TelegramNotificationService()
    return _service