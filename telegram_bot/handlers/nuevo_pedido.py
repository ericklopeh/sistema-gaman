import logging
from pathlib import Path

from telegram import ReplyKeyboardMarkup, ReplyKeyboardRemove, Update
from telegram.ext import ContextTypes, ConversationHandler

from config import settings
from handlers.start import MAIN_KEYBOARD
from services.constants import OUT_OF_HOURS_MSG
from services.gaman_api import GamanAPIError, get_gaman_api
from services.temp_files import cleanup_dir, save_telegram_photo, session_dir

log = logging.getLogger(__name__)

CLIENTE, TIPO, FOTO = range(3)

TIPO_KEYBOARD = ReplyKeyboardMarkup(
    [["🛋️ Mueble", "💵 Dinero"]],
    resize_keyboard=True,
    one_time_keyboard=True,
)

DOC_PROMPTS = {
    "orden_descuento": "📷 Envía la foto de la *Orden de descuento*.",
    "pedido": "📷 Envía la foto del *Pedido*.",
    "caratula_banco": "📷 Envía la foto de la *Carátula del banco*.",
    "caratula_bancaria": "📷 Envía la foto de la *Carátula del banco*.",
}

DOC_RECEIVED_LABELS = {
    "orden_descuento": "Orden de descuento",
    "pedido": "Pedido",
    "caratula_banco": "Carátula banco",
    "caratula_bancaria": "Carátula banco",
}

CHECKLIST_MUEBLE = ["orden_descuento", "pedido"]
CHECKLIST_DINERO = ["pedido", "orden_descuento", "caratula_bancaria"]


def _fuera_de_horario() -> bool:
    if not settings.OPERATING_HOURS_ENABLED:
        return False
    try:
        h = get_gaman_api().horario_operativo()
        return bool(h.get("enabled")) and not h.get("captura_disponible_vendedor", True)
    except Exception:
        return False


def _vendedor_name(update: Update) -> str:
    user = update.effective_user
    if not user:
        return "Vendedor Telegram"
    return user.full_name or user.username or f"TG-{user.id}"


def _normalize_tipo(text: str) -> str | None:
    t = (text or "").lower()
    if "mueble" in t or "🛋" in text:
        return "mueble"
    if "dinero" in t or "💵" in text:
        return "dinero"
    return None


def _checklist(order_type: str) -> list[str]:
    return CHECKLIST_DINERO if order_type == "dinero" else CHECKLIST_MUEBLE


def _doc_label(doc_type: str) -> str:
    return DOC_RECEIVED_LABELS.get(doc_type, doc_type.replace("_", " ").title())


def _pending_docs(checklist: list[dict]) -> list[dict]:
    return [item for item in (checklist or []) if not item.get("completo")]


def _checklist_complete(checklist: list[dict]) -> bool:
    if not checklist:
        return False
    return all(item.get("completo") for item in checklist)


def _format_progress(case: dict, just_received: str | None = None) -> str:
    checklist = case.get("checklist") or []
    lines: list[str] = []

    if just_received:
        lines.append(f"✅ *{_doc_label(just_received)}* recibida")

    pending = _pending_docs(checklist)
    if pending:
        lines.append("\n*Pendiente:*")
        for item in pending:
            lines.append(f"📄 {item.get('label') or _doc_label(item.get('tipo', ''))}")

    received = [item for item in checklist if item.get("completo")]
    if received and not pending:
        lines.append("\n*Documentos recibidos:*")
        for item in received:
            lines.append(f"✅ {item.get('label') or _doc_label(item.get('tipo', ''))}")

    return "\n".join(lines)


async def nuevo_pedido_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    if _fuera_de_horario():
        await update.message.reply_text(OUT_OF_HOURS_MSG, reply_markup=MAIN_KEYBOARD)
        return ConversationHandler.END
    context.user_data.clear()
    context.user_data["temp_dir"] = session_dir(update.effective_user.id)
    await update.message.reply_text(
        "📦 *Nuevo pedido*\n\nEscribe el *nombre del cliente*:",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardRemove(),
    )
    return CLIENTE


async def recibir_cliente(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    cliente = (update.message.text or "").strip()
    if len(cliente) < 2:
        await update.message.reply_text("Nombre muy corto. Escribe el nombre del cliente:")
        return CLIENTE

    context.user_data["cliente"] = cliente
    await update.message.reply_text(
        f"Cliente: *{cliente}*\n\nTipo de venta:",
        parse_mode="Markdown",
        reply_markup=TIPO_KEYBOARD,
    )
    return TIPO


async def recibir_tipo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    order_type = _normalize_tipo(update.message.text or "")
    if not order_type:
        await update.message.reply_text("Elige una opción:", reply_markup=TIPO_KEYBOARD)
        return TIPO

    context.user_data["order_type"] = order_type
    context.user_data["doc_queue"] = _checklist(order_type)

    try:
        case = get_gaman_api().crear_pedido_telegram(
            cliente=context.user_data["cliente"],
            order_type=order_type,
            vendedor=_vendedor_name(update),
            seller_telegram_chat_id=update.effective_user.id,
        )
    except GamanAPIError as exc:
        text = OUT_OF_HOURS_MSG if "OUT_OF_OPERATING_HOURS" in str(exc) else f"No pude crear el pedido: {exc}"
        await update.message.reply_text(text, reply_markup=MAIN_KEYBOARD)
        cleanup_dir(context.user_data.get("temp_dir"))
        context.user_data.clear()
        return ConversationHandler.END
    except Exception as exc:
        log.exception("Error creando pedido")
        await update.message.reply_text(
            f"No pude conectar con GAMAN. Verifique el backend.\n{exc}",
            reply_markup=MAIN_KEYBOARD,
        )
        cleanup_dir(context.user_data.get("temp_dir"))
        context.user_data.clear()
        return ConversationHandler.END

    folio = case.get("folio") or case.get("public_id")
    context.user_data["folio"] = folio
    context.user_data["last_case"] = case
    return await _pedir_siguiente_foto(update, context, case)


async def _pedir_siguiente_foto(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    case: dict | None = None,
) -> int:
    case = case or context.user_data.get("last_case") or {}
    checklist = case.get("checklist") or []
    pending = _pending_docs(checklist)

    if not pending:
        queue = context.user_data.get("doc_queue", [])
        idx = len([i for i in checklist if i.get("completo")])
        if idx < len(queue):
            doc_type = queue[idx]
            pending = [{"tipo": doc_type, "label": _doc_label(doc_type), "completo": False}]

    if not pending:
        return await _finalizar(update, context, case)

    doc_type = pending[0].get("tipo") or pending[0].get("label", "")
    context.user_data["current_doc"] = doc_type
    label = DOC_PROMPTS.get(doc_type, f"📷 Envía la foto: *{_doc_label(doc_type)}*.")
    folio = context.user_data.get("folio", "")
    await update.message.reply_text(
        f"Folio: `{folio}`\n\n{label}",
        parse_mode="Markdown",
    )
    return FOTO


async def recibir_foto(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    doc_type = context.user_data.get("current_doc")
    folio = context.user_data.get("folio")
    temp_dir: Path = context.user_data.get("temp_dir")

    if not doc_type or not folio:
        await update.message.reply_text("Sesión expirada. Use /nuevo_pedido para reiniciar.", reply_markup=MAIN_KEYBOARD)
        cleanup_dir(temp_dir)
        context.user_data.clear()
        return ConversationHandler.END

    photo = update.message.photo
    document = update.message.document
    if not photo and not document:
        await update.message.reply_text("Envía una *foto* (no texto).", parse_mode="Markdown")
        return FOTO

    try:
        if photo:
            tg_file = await context.bot.get_file(photo[-1].file_id)
        else:
            mime = (document.mime_type or "").lower()
            if not mime.startswith("image/"):
                await update.message.reply_text("Solo se aceptan imágenes. Reenvía la foto.")
                return FOTO
            tg_file = await context.bot.get_file(document.file_id)

        local_path = await save_telegram_photo(tg_file, temp_dir, f"{doc_type}.jpg")
        case = get_gaman_api().subir_documento(folio, doc_type, local_path)
    except GamanAPIError as exc:
        if "OUT_OF_OPERATING_HOURS" in str(exc):
            await update.message.reply_text(OUT_OF_HOURS_MSG, reply_markup=MAIN_KEYBOARD)
            cleanup_dir(temp_dir)
            context.user_data.clear()
            return ConversationHandler.END
        await update.message.reply_text(f"Error al subir documento. Reenvía la foto.\n{exc}")
        return FOTO
    except Exception as exc:
        log.exception("Error subiendo documento folio=%s tipo=%s", folio, doc_type)
        await update.message.reply_text(
            f"No pude guardar la foto. Reenvía o use /cancel.\nDetalle: {exc}",
        )
        return FOTO

    context.user_data["last_case"] = case

    if _checklist_complete(case.get("checklist") or []):
        await update.message.reply_text(
            _format_progress(case, just_received=doc_type),
            parse_mode="Markdown",
        )
        return await _finalizar(update, context, case)

    progress = _format_progress(case, just_received=doc_type)
    next_pending = _pending_docs(case.get("checklist") or [])
    next_label = ""
    if next_pending:
        next_doc = next_pending[0].get("tipo", "")
        next_label = f"\n\nEnvía ahora la foto del *{next_pending[0].get('label') or _doc_label(next_doc)}*."
    await update.message.reply_text(f"{progress}{next_label}", parse_mode="Markdown")
    return await _pedir_siguiente_foto(update, context, case)


async def _finalizar(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    case: dict | None = None,
) -> int:
    case = case or context.user_data.get("last_case") or {}
    folio = case.get("folio") or case.get("official_folio") or context.user_data.get("folio", "—")
    cliente = case.get("cliente") or context.user_data.get("cliente", "—")
    estado = case.get("estado", "PENDIENTE_REVISION")

    checklist = case.get("checklist") or []
    docs_lines = "\n".join(
        f"✅ {item.get('label') or _doc_label(item.get('tipo', ''))}"
        for item in checklist
        if item.get("completo")
    )

    cleanup_dir(context.user_data.get("temp_dir"))
    context.user_data.clear()

    await update.message.reply_text(
        "✅ *Pedido registrado correctamente*\n\n"
        f"*Folio:*\n{folio}\n\n"
        f"*Cliente:*\n{cliente}\n\n"
        f"*Documentos recibidos:*\n{docs_lines or '—'}\n\n"
        f"*Estado:* {estado}\n\n"
        "El pedido aparecerá en GAMAN Web → /sistemas",
        parse_mode="Markdown",
        reply_markup=MAIN_KEYBOARD,
    )
    return ConversationHandler.END


async def foto_invalida(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    doc_type = context.user_data.get("current_doc", "documento")
    await update.message.reply_text(
        f"Se esperaba foto de *{_doc_label(doc_type)}*. Envía una imagen o /cancel.",
        parse_mode="Markdown",
    )
    return FOTO


async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    cleanup_dir(context.user_data.get("temp_dir"))
    context.user_data.clear()
    await update.message.reply_text("Captura cancelada.", reply_markup=MAIN_KEYBOARD)
    return ConversationHandler.END