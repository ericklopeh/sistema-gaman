from pathlib import Path

import httpx

from config import settings


class GamanAPIError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class GamanAPI:
    def __init__(self, base_url: str | None = None, timeout: float = 30.0) -> None:
        self.base_url = (base_url or settings.GAMAN_API_URL).rstrip("/")
        self.timeout = timeout

    def _url(self, path: str) -> str:
        return f"{self.base_url}{path}"

    def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = getattr(client, method)(self._url(path), **kwargs)
        except httpx.RequestError as exc:
            raise GamanAPIError(f"No se pudo conectar con GAMAN ({self.base_url}): {exc}") from exc
        if resp.status_code >= 400:
            raise GamanAPIError(resp.text, resp.status_code)
        return resp

    def health(self) -> dict:
        return self._request("get", "/health").json()

    def crear_pedido_telegram(
        self,
        *,
        cliente: str,
        order_type: str,
        vendedor: str,
        seller_telegram_chat_id: int,
    ) -> dict:
        data = {
            "cliente": cliente,
            "order_type": order_type,
            "vendedor": vendedor,
            "seller_telegram_chat_id": seller_telegram_chat_id,
        }
        return self._request("post", "/api/pedidos/from-telegram", data=data).json()

    def subir_documento(
        self,
        folio: str,
        document_type: str,
        file_path: Path,
        usuario: str = "telegram",
    ) -> dict:
        with file_path.open("rb") as fh:
            files = {"archivo": (file_path.name, fh, "image/jpeg")}
            data = {"document_type": document_type, "usuario": usuario}
            return self._request(
                "post",
                f"/api/pedidos/{folio}/documentos",
                data=data,
                files=files,
            ).json()

    def mis_pedidos(self, telegram_id: int) -> list[dict]:
        return self._request("get", f"/api/vendedores/{telegram_id}/pedidos").json()

    def ventas_hoy(self, telegram_id: int) -> dict:
        return self._request("get", f"/api/vendedores/{telegram_id}/ventas-hoy").json()

    def estatus(self, telegram_id: int) -> dict:
        return self._request("get", f"/api/vendedores/{telegram_id}/estatus").json()

    def horario_operativo(self) -> dict:
        return self._request("get", "/api/config/horario-operativo").json()

    def mis_pendientes(self, telegram_id: int) -> list[dict]:
        return self._request("get", f"/api/vendedores/{telegram_id}/pendientes").json()


_api: GamanAPI | None = None


def get_gaman_api() -> GamanAPI:
    global _api
    if _api is None:
        _api = GamanAPI()
    return _api