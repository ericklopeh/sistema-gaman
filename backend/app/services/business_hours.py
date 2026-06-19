"""Control de horario operativo — captura restringida para VENDEDOR."""

from datetime import datetime, time
from pathlib import Path
from zoneinfo import ZoneInfo

from fastapi import HTTPException

from app.core.config import settings

OUT_OF_HOURS_MESSAGE = (
    "⛔ Sistema GAMAN fuera de horario operativo.\n\n"
    "La captura de pedidos está disponible únicamente:\n\n"
    "Lunes a Viernes\n"
    "09:00 AM a 06:00 PM\n\n"
    "Intente nuevamente dentro del horario establecido."
)

EXEMPT_ROLES = frozenset({"ADMIN", "SISTEMAS"})
CAPTURE_RESTRICTED_ROLES = frozenset({"VENDEDOR"})

_CONFIG_PATH = Path(settings.STORAGE_PATH) / "config" / "horario_operativo.json"


_DAY_NAME_TO_ISO = {
    "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6, "SUN": 7,
}


def _default_days() -> list[int]:
    raw = (getattr(settings, "OPERATING_DAYS", None) or "").strip()
    if raw and any(c.isalpha() for c in raw):
        days = []
        for part in raw.split(","):
            key = part.strip().upper()[:3]
            if key in _DAY_NAME_TO_ISO:
                days.append(_DAY_NAME_TO_ISO[key])
        if days:
            return sorted(set(days))
    return [int(d.strip()) for d in settings.OPERATING_HOURS_DAYS.split(",") if d.strip()]


def _load_overrides() -> dict:
    if not _CONFIG_PATH.exists():
        return {}
    try:
        import json
        return json.loads(_CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def get_operating_hours_config() -> dict:
    """Configuración actual (env + overrides JSON para futura UI GAMAN)."""
    overrides = _load_overrides()
    return {
        "enabled": overrides.get("enabled", settings.OPERATING_HOURS_ENABLED),
        "timezone": overrides.get("timezone", settings.OPERATING_HOURS_TIMEZONE),
        "start": overrides.get("start", settings.OPERATING_HOURS_START),
        "end": overrides.get("end", settings.OPERATING_HOURS_END),
        "days": overrides.get("days", _default_days()),
        "days_label": "Lunes a Viernes",
        "exempt_roles": sorted(EXEMPT_ROLES),
        "restricted_roles": sorted(CAPTURE_RESTRICTED_ROLES),
        "editable_from_gaman": True,
        "config_path": str(_CONFIG_PATH),
    }


def save_operating_hours_config(data: dict) -> dict:
    """Persiste overrides — para configuración futura desde GAMAN Web."""
    import json

    _CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    current = _load_overrides()
    for key in ("enabled", "timezone", "start", "end", "days"):
        if key in data:
            current[key] = data[key]
    _CONFIG_PATH.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
    return get_operating_hours_config()


def _parse_hhmm(value: str) -> time:
    hour, minute = value.strip().split(":", 1)
    return time(int(hour), int(minute))


def is_within_operating_hours(now: datetime | None = None) -> bool:
    cfg = get_operating_hours_config()
    if not cfg["enabled"]:
        return True

    tz = ZoneInfo(cfg["timezone"])
    now = now or datetime.now(tz)
    if now.tzinfo is None:
        now = now.replace(tzinfo=tz)
    else:
        now = now.astimezone(tz)

    if now.isoweekday() not in cfg["days"]:
        return False

    start = _parse_hhmm(cfg["start"])
    end = _parse_hhmm(cfg["end"])
    current = now.time()
    return start <= current < end


def role_requires_hours_check(role: str | None) -> bool:
    if not role:
        return False
    return role.upper() in CAPTURE_RESTRICTED_ROLES


def can_capture(role: str | None) -> bool:
    """True si el rol puede capturar en este momento."""
    if not role_requires_hours_check(role):
        return True
    return is_within_operating_hours()


def assert_capture_allowed(role: str | None, *, channel: str = "web") -> None:
    """Lanza HTTP 403 si VENDEDOR intenta capturar fuera de horario."""
    if channel == "telegram":
        role = "VENDEDOR"
    if not role_requires_hours_check(role):
        return
    if not is_within_operating_hours():
        raise HTTPException(
            status_code=403,
            detail={
                "code": "OUT_OF_OPERATING_HOURS",
                "message": OUT_OF_HOURS_MESSAGE,
                "horario": get_operating_hours_config(),
            },
        )


def status_payload() -> dict:
    cfg = get_operating_hours_config()
    within = is_within_operating_hours()
    return {
        **cfg,
        "within_hours": within,
        "captura_disponible_vendedor": within if cfg["enabled"] else True,
    }