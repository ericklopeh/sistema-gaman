from telegram import ReplyKeyboardMarkup, Update
from telegram.ext import ContextTypes

from services.constants import HORARIO_MSG, MENU_LABELS

MAIN_KEYBOARD = ReplyKeyboardMarkup(
    [
        [MENU_LABELS["nuevo_pedido"][0], MENU_LABELS["mis_pedidos"][0]],
        [MENU_LABELS["ventas_hoy"][0], MENU_LABELS["estatus"][0]],
    ],
    resize_keyboard=True,
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    nombre = user.full_name if user else "vendedor"
    await update.message.reply_text(
        f"Bienvenido a Sistema GAMAN, {nombre}.\n\n"
        "Opciones:\n\n"
        "📦 Nuevo pedido\n"
        "📋 Mis pedidos\n"
        "📈 Mis ventas de hoy\n"
        "🔍 Consultar estatus\n\n"
        f"{HORARIO_MSG}",
        reply_markup=MAIN_KEYBOARD,
    )