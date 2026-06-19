from telegram import Update
from telegram.ext import ContextTypes

from handlers.start import MAIN_KEYBOARD
from services.gaman_api import GamanAPIError, get_gaman_api


def _telegram_id(update: Update) -> int:
    return update.effective_user.id


def _fmt_fecha(iso: str | None) -> str:
    if not iso:
        return "—"
    return iso[:10] if len(iso) >= 10 else iso


async def mis_pedidos(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    tid = _telegram_id(update)
    try:
        pedidos = get_gaman_api().mis_pedidos(tid)
    except GamanAPIError as exc:
        await update.message.reply_text(f"No pude consultar pedidos: {exc}", reply_markup=MAIN_KEYBOARD)
        return

    if not pedidos:
        await update.message.reply_text("📋 No tienes pedidos registrados.", reply_markup=MAIN_KEYBOARD)
        return

    lines = [f"📋 Mis pedidos ({len(pedidos)}):"]
    for p in pedidos[:15]:
        lines.append(
            f"\nFolio:\n{p.get('folio')}\n\n"
            f"Cliente:\n{p.get('cliente')}\n\n"
            f"Estado:\n{p.get('estado')}\n\n"
            f"Fecha:\n{_fmt_fecha(p.get('created_at'))}"
        )
    if len(pedidos) > 15:
        lines.append(f"\n… y {len(pedidos) - 15} más")

    await update.message.reply_text("\n".join(lines), reply_markup=MAIN_KEYBOARD)


async def mis_pendientes(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    tid = _telegram_id(update)
    try:
        pendientes = get_gaman_api().mis_pendientes(tid)
    except GamanAPIError as exc:
        await update.message.reply_text(f"No pude consultar pendientes: {exc}", reply_markup=MAIN_KEYBOARD)
        return

    if not pendientes:
        await update.message.reply_text("Sin pendientes activos.", reply_markup=MAIN_KEYBOARD)
        return

    lines = [f"⏳ Pendientes ({len(pendientes)}):"]
    for p in pendientes[:15]:
        lines.append(f"\n• {p.get('folio')} — {p.get('cliente')} ({p.get('estado')})")
    await update.message.reply_text("\n".join(lines), reply_markup=MAIN_KEYBOARD)


async def mis_ventas_hoy(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    tid = _telegram_id(update)
    try:
        data = get_gaman_api().ventas_hoy(tid)
    except GamanAPIError as exc:
        await update.message.reply_text(f"No pude consultar ventas: {exc}", reply_markup=MAIN_KEYBOARD)
        return

    ventas = data.get("ventas", [])
    if not ventas:
        await update.message.reply_text(
            f"📈 Sin ventas hoy ({data.get('fecha', 'hoy')}).",
            reply_markup=MAIN_KEYBOARD,
        )
        return

    lines = [f"📈 Mis ventas de hoy ({data.get('total', len(ventas))}):"]
    for v in ventas:
        tipo = v.get("tipo") or v.get("order_type") or "—"
        lines.append(
            f"\nFolio:\n{v.get('folio')}\n\n"
            f"Cliente:\n{v.get('cliente')}\n\n"
            f"Tipo:\n{tipo}\n\n"
            f"Estado:\n{v.get('estado')}"
        )
    await update.message.reply_text("\n".join(lines), reply_markup=MAIN_KEYBOARD)


async def estatus(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    tid = _telegram_id(update)
    try:
        data = get_gaman_api().estatus(tid)
    except GamanAPIError as exc:
        await update.message.reply_text(f"No pude consultar estatus: {exc}", reply_markup=MAIN_KEYBOARD)
        return

    lines = [f"🔍 Estatus — {data.get('total_pedidos', 0)} pedidos", ""]
    por_estado = data.get("por_estado", {})
    if por_estado:
        lines.append("Resumen por estado:")
        for estado, count in sorted(por_estado.items(), key=lambda x: -x[1]):
            lines.append(f"• {estado}: {count}")

    recientes = data.get("recientes", [])
    if recientes:
        lines.append("\nÚltimos casos:")
        for r in recientes:
            lines.append(
                f"\nFolio:\n{r.get('folio')}\n\n"
                f"Cliente:\n{r.get('cliente')}\n\n"
                f"Estado:\n{r.get('estado')}\n\n"
                f"Última actualización:\n{_fmt_fecha(r.get('updated_at'))}"
            )

    await update.message.reply_text("\n".join(lines), reply_markup=MAIN_KEYBOARD)