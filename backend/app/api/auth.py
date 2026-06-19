from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_USERS: dict[str, dict] = {
    "admin@gaman.local": {
        "password": "demo123",
        "role": "ADMIN",
        "name": "Administrador GAMAN",
        "vendedor": None,
    },
    "sistemas@gaman.local": {
        "password": "demo123",
        "role": "SISTEMAS",
        "name": "Operador Sistemas",
        "vendedor": None,
    },
    "recepcion@gaman.local": {
        "password": "demo123",
        "role": "RECEPCION",
        "name": "Recepción Compulsa",
        "vendedor": None,
    },
    "compras@gaman.local": {
        "password": "demo123",
        "role": "COMPRAS",
        "name": "Equipo Compras",
        "vendedor": None,
    },
    "vendedor@gaman.local": {
        "password": "demo123",
        "role": "VENDEDOR",
        "name": "Eliezer Chipuli",
        "vendedor": "Eliezer Chipuli",
        "telegram_id": 100001,
    },
}


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict
    demo_mode: bool


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    record = DEMO_USERS.get(body.email.lower())
    if not record or record["password"] != body.password:
        raise HTTPException(401, "Credenciales inválidas")

    token = f"demo-{body.email.lower()}"
    user = {
        "email": body.email.lower(),
        "role": record["role"],
        "name": record["name"],
        "vendedor": record.get("vendedor"),
        "telegram_id": record.get("telegram_id"),
    }
    return LoginResponse(token=token, user=user, demo_mode=settings.DEMO_MODE)


@router.get("/users")
def list_demo_users() -> list[dict]:
    """Lista usuarios demo (solo en DEMO_MODE)."""
    if not settings.DEMO_MODE:
        raise HTTPException(403, "No disponible fuera de modo demo")
    return [
        {"email": email, "role": u["role"], "name": u["name"]}
        for email, u in DEMO_USERS.items()
    ]