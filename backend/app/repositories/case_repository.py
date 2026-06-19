import json
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings


class CaseRepository:
    """Persistencia JSON — preparada para migrar a PostgreSQL/SQLAlchemy."""

    def __init__(self) -> None:
        self._path = Path(settings.STORAGE_PATH) / "cases" / "index.json"
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._cases: dict[int, dict] = {}
        self._counter = 0
        self._load()

    def _load(self) -> None:
        if self._path.exists():
            data = json.loads(self._path.read_text(encoding="utf-8"))
            self._cases = {int(k): v for k, v in data.get("cases", {}).items()}
            self._counter = data.get("counter", max(self._cases.keys(), default=0))

    def _save(self) -> None:
        payload = {
            "counter": self._counter,
            "cases": {str(k): v for k, v in self._cases.items()},
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self._path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _next_id(self) -> int:
        self._counter += 1
        return self._counter

    def _next_folio(self) -> str:
        folios = [
            int(c["official_folio"])
            for c in self._cases.values()
            if c.get("official_folio", "").isdigit()
        ]
        n = max(folios, default=0) + 1
        return f"{n:06d}"

    def create(self, data: dict) -> dict:
        case_id = self._next_id()
        now = datetime.now(timezone.utc).isoformat()
        record = {**data, "id": case_id, "created_at": now, "updated_at": now}
        self._cases[case_id] = record
        self._save()
        return record

    def update(self, case_id: int, updates: dict) -> dict | None:
        if case_id not in self._cases:
            return None
        self._cases[case_id].update(updates)
        self._cases[case_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._save()
        return self._cases[case_id]

    def get(self, case_id: int) -> dict | None:
        return self._cases.get(case_id)

    def list_all(self) -> list[dict]:
        return list(self._cases.values())

    def list_by_status(self, statuses: list[str]) -> list[dict]:
        return [c for c in self._cases.values() if c.get("estado") in statuses]

    def next_official_folio(self) -> str:
        return self._next_folio()

    def get_by_folio(self, folio: str) -> dict | None:
        folio = (folio or "").strip()
        if folio.upper().startswith("PED-"):
            folio = folio[4:]
        folio = folio.zfill(6) if folio.isdigit() else folio
        for case in self._cases.values():
            official = case.get("official_folio", "")
            public = case.get("public_id", "")
            if official == folio or public == f"PED-{folio}" or public == folio:
                return case
        return None

    def list_by_telegram_id(self, telegram_id: int) -> list[dict]:
        return [
            c for c in self._cases.values()
            if c.get("seller_telegram_chat_id") == telegram_id
            and c.get("case_type") == "pedido"
        ]


_case_repo: CaseRepository | None = None


def get_case_repository() -> CaseRepository:
    global _case_repo
    if _case_repo is None:
        _case_repo = CaseRepository()
    return _case_repo