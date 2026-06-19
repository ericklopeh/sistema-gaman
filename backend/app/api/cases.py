from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.case_service import get_case_service

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("")
def list_cases() -> list[dict]:
    svc = get_case_service()
    return svc.repo.list_all()


@router.get("/{case_id}")
def get_case(case_id: int) -> dict:
    case = get_case_service().repo.get(case_id)
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    case["checklist"] = get_case_service().get_checklist(case)
    return case


@router.get("/{case_id}/historial")
def get_historial(case_id: int) -> list[dict]:
    case = get_case_service().repo.get(case_id)
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    return case.get("historial", [])


@router.get("/{case_id}/checklist")
def get_checklist(case_id: int) -> list[dict]:
    case = get_case_service().repo.get(case_id)
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    return get_case_service().get_checklist(case)


@router.get("/{case_id}/download/{filename}")
def download_document(case_id: int, filename: str):
    path = get_case_service().get_document_path(case_id, filename)
    if not path:
        raise HTTPException(404, "Archivo no encontrado")
    return FileResponse(
        path=path,
        filename=path.name,
        media_type="application/octet-stream",
    )