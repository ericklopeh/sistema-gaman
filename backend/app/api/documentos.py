from pathlib import Path

from fastapi import APIRouter

from app.services.case_service import get_case_service

router = APIRouter(prefix="/api/documentos", tags=["documentos"])


@router.get("")
def list_documentos() -> list[dict]:
    svc = get_case_service()
    items = []
    for case in svc.repo.list_all():
        folder = case.get("folder_path", "")
        sp = case.get("sharepoint_path", "")
        for doc in case.get("documentos", []):
            items.append({
                "id": f"{case['id']}-{doc['tipo']}",
                "folio": case.get("public_id"),
                "official_folio": case.get("official_folio"),
                "cliente": case.get("cliente"),
                "vendedor": case.get("vendedor"),
                "tipo_documento": doc.get("tipo"),
                "label": doc.get("label", doc.get("tipo")),
                "filename": doc.get("filename"),
                "fecha": case.get("updated_at"),
                "ruta_local": str(Path(folder) / doc.get("filename", "")) if folder else "",
                "ruta_sharepoint": f"{sp}/{doc.get('filename', '')}" if sp else "",
                "case_id": case["id"],
            })
    items.sort(key=lambda x: x.get("fecha", ""), reverse=True)
    return items