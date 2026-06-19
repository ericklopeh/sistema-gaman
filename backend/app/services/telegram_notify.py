"""Compat — usar TelegramNotificationService."""

from app.services.telegram_notification_service import (
    TelegramNotificationService,
    get_telegram_notification_service,
)


def send_telegram_message(chat_id: int | str, text: str) -> dict:
    return get_telegram_notification_service().send_message(chat_id, text)


def notificar_compra_realizada(case: dict) -> dict:
    return get_telegram_notification_service().notify_compra_realizada(case)