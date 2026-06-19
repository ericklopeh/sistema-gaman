from datetime import datetime
from pathlib import Path

from app.domain import constants as C
from app.repositories.case_repository import get_case_repository
from app.services.autorizaciones_excel import generar_autorizacion_bytes
from app.services.sindicato_excel import generar_sindicato_bytes
from app.services.telegram_notify import notificar_compra_realizada
from app.storage import get_storage_provider


class CaseService:
    def __init__(self) -> None:
        self.repo = get_case_repository()
        self.storage = get_storage_provider()

    def _semana_code(self, semana: int | None = None) -> str:
        if semana:
            year = datetime.now().year
            return f"SEM_{semana:02d}"
        now = datetime.now()
        return f"SEM_{now.isocalendar().week:02d}"

    def _append_history(
        self, case: dict, old_status: str | None, new_status: str,
        action_user: str, notes: str = "", action_source: str = "sistema",
    ) -> None:
        entry = {
            "old_status": old_status,
            "new_status": new_status,
            "action_user": action_user,
            "action_source": action_source,
            "notes": notes,
            "timestamp": datetime.now().isoformat(),
        }
        case.setdefault("historial", []).append(entry)

    def _persist_historial(self, case: dict) -> None:
        folder = Path(case["folder_path"])
        self.storage.save_historial(folder, case.get("historial", []))

    def _transition(self, case: dict, new_status: str, action_user: str, notes: str = "") -> dict:
        old = case["estado"]
        if not C.can_transition(old, new_status) and old != new_status:
            raise ValueError(f"Transición no permitida: {old} → {new_status}")
        case["estado"] = new_status
        self._append_history(case, old, new_status, action_user, notes)
        self._persist_historial(case)
        return case

    def capturar_pedido(
        self,
        cliente: str,
        order_type: str,
        vendedor: str,
        documentos: dict[str, bytes],
        *,
        seller_telegram_chat_id: int | None = None,
        semana: int | None = None,
    ) -> dict:
        order_type = C.normalize_order_type(order_type)
        folio = self.repo.next_official_folio()
        semana_code = self._semana_code(semana)
        folder = self.storage.ensure_case_folder(semana_code, folio, cliente)

        docs_meta = []
        ext_map = {
            C.DOC_PEDIDO: "pedido.jpg",
            C.DOC_ORDEN_DESCUENTO: "orden_descuento.jpg",
            C.DOC_CARATULA_BANCARIA: "caratula_banco.jpg",
        }

        for doc_type, content in documentos.items():
            filename = ext_map.get(doc_type, f"{doc_type}.bin")
            meta = self.storage.save_document(
                folder, filename, content,
                semana=semana_code, vendedor=vendedor, cliente=cliente,
                folio=folio, document_type=doc_type,
            )
            docs_meta.append({
                "tipo": doc_type,
                "filename": filename,
                "label": C.doc_type_label(doc_type),
                **meta,
            })

        case = self.repo.create({
            "public_id": f"PED-{folio}",
            "case_type": C.CASE_TYPE_PEDIDO,
            "order_type": order_type,
            "cliente": cliente,
            "official_folio": folio,
            "estado": C.ST_CAPTURADO,
            "vendedor": vendedor,
            "seller_telegram_chat_id": seller_telegram_chat_id,
            "semana": semana_code,
            "folder_path": str(folder),
            "documentos": docs_meta,
            "historial": [],
            "compra": None,
            "autorizacion": None,
            "storage_provider": self.storage.provider_name,
        })
        self._append_history(case, None, C.ST_CAPTURADO, vendedor, "Pedido capturado")
        self._persist_historial(case)
        self.repo.update(case["id"], case)

        if self._checklist_complete(case):
            case = self.finalizar_captura(case["id"], vendedor)

        return case

    def crear_pedido_telegram(
        self,
        cliente: str,
        order_type: str,
        vendedor: str,
        seller_telegram_chat_id: int,
        documentos: dict[str, bytes] | None = None,
        semana: int | None = None,
    ) -> dict:
        """Crea pedido desde Telegram. Con documentos vacíos crea skeleton CAPTURADO."""
        documentos = documentos or {}
        if documentos:
            return self.capturar_pedido(
                cliente=cliente,
                order_type=order_type,
                vendedor=vendedor,
                documentos=documentos,
                seller_telegram_chat_id=seller_telegram_chat_id,
                semana=semana,
            )

        order_type = C.normalize_order_type(order_type)
        folio = self.repo.next_official_folio()
        semana_code = self._semana_code(semana)
        folder = self.storage.ensure_case_folder(semana_code, folio, cliente)

        case = self.repo.create({
            "public_id": f"PED-{folio}",
            "case_type": C.CASE_TYPE_PEDIDO,
            "order_type": order_type,
            "cliente": cliente,
            "official_folio": folio,
            "estado": C.ST_CAPTURADO,
            "vendedor": vendedor,
            "seller_telegram_chat_id": seller_telegram_chat_id,
            "semana": semana_code,
            "folder_path": str(folder),
            "documentos": [],
            "historial": [],
            "compra": None,
            "autorizacion": None,
            "storage_provider": self.storage.provider_name,
        })
        self._append_history(
            case, None, C.ST_CAPTURADO, vendedor,
            "Pedido creado desde Telegram", action_source="telegram",
        )
        self._persist_historial(case)
        self.repo.update(case["id"], case)
        return case

    def agregar_documento_por_folio(
        self,
        folio: str,
        document_type: str,
        content: bytes,
        action_user: str = "telegram",
    ) -> dict:
        case = self.repo.get_by_folio(folio)
        if not case:
            raise ValueError(f"Pedido no encontrado: {folio}")

        ext_map = {
            C.DOC_PEDIDO: "pedido.jpg",
            C.DOC_ORDEN_DESCUENTO: "orden_descuento.jpg",
            C.DOC_CARATULA_BANCARIA: "caratula_banco.jpg",
        }
        filename = ext_map.get(document_type, f"{document_type}.jpg")
        folder = Path(case["folder_path"])

        for doc in case.get("documentos", []):
            if doc["tipo"] == document_type:
                doc["is_active"] = False

        meta = self.storage.save_document(
            folder, filename, content,
            semana=case["semana"], vendedor=case["vendedor"],
            cliente=case["cliente"], folio=case["official_folio"],
            document_type=document_type,
        )
        case["documentos"] = [
            d for d in case.get("documentos", []) if d["tipo"] != document_type
        ]
        case["documentos"].append({
            "tipo": document_type,
            "filename": filename,
            "label": C.doc_type_label(document_type),
            **meta,
        })
        doc_label = C.doc_type_label(document_type)
        self._append_history(
            case, case["estado"], case["estado"], action_user,
            f"Documento {doc_label} recibido",
            action_source="telegram",
        )
        self._persist_historial(case)
        self.repo.update(case["id"], case)

        if self._checklist_complete(case) and case["estado"] == C.ST_CAPTURADO:
            self._append_history(
                case, C.ST_CAPTURADO, C.ST_CAPTURADO, action_user,
                "Documentos completos", action_source="telegram",
            )
            self._persist_historial(case)
            self.repo.update(case["id"], case)
            case = self.finalizar_captura(case["id"], action_user)

        return case

    def pedidos_por_telegram(self, telegram_id: int) -> list[dict]:
        cases = self.repo.list_by_telegram_id(telegram_id)
        return sorted(cases, key=lambda c: c.get("created_at", ""), reverse=True)

    def ventas_hoy_por_telegram(self, telegram_id: int) -> list[dict]:
        hoy = datetime.now().date().isoformat()
        finalizados = {C.ST_FINALIZADO, C.ST_COMPRADO, C.ST_NOTIFICADO_VENDEDOR}
        return [
            c for c in self.repo.list_by_telegram_id(telegram_id)
            if c.get("estado") in finalizados
            and (c.get("compra") or {}).get("fecha", c.get("updated_at", ""))[:10] == hoy
            or c.get("updated_at", "")[:10] == hoy
            and c.get("estado") == C.ST_FINALIZADO
        ]

    def estatus_por_telegram(self, telegram_id: int) -> dict:
        cases = self.repo.list_by_telegram_id(telegram_id)
        por_estado: dict[str, int] = {}
        for c in cases:
            e = c.get("estado", "desconocido")
            por_estado[e] = por_estado.get(e, 0) + 1
        recientes = sorted(cases, key=lambda x: x.get("updated_at", ""), reverse=True)[:5]
        return {
            "telegram_id": telegram_id,
            "total_pedidos": len(cases),
            "por_estado": por_estado,
            "recientes": [
                {
                    "folio": c.get("public_id"),
                    "cliente": c.get("cliente"),
                    "estado": c.get("estado"),
                    "updated_at": c.get("updated_at"),
                }
                for c in recientes
            ],
        }

    def _active_doc_types(self, case: dict) -> set[str]:
        return {d["tipo"] for d in case.get("documentos", [])}

    def _checklist_complete(self, case: dict) -> bool:
        required = set(C.required_doc_types_for_order(case["order_type"]))
        return required.issubset(self._active_doc_types(case))

    def get_checklist(self, case: dict) -> list[dict]:
        return C.checklist_lines(case["order_type"], self._active_doc_types(case))

    def finalizar_captura(self, case_id: int, action_user: str) -> dict:
        case = self.repo.get(case_id)
        if not case:
            raise ValueError("Caso no encontrado")
        if not self._checklist_complete(case):
            missing = set(C.required_doc_types_for_order(case["order_type"])) - self._active_doc_types(case)
            raise ValueError(f"Documentos faltantes: {', '.join(missing)}")
        notes = "Documentos completos — enviado a Sistemas"
        if action_user == "telegram" or (case.get("seller_telegram_chat_id")):
            notes = "Pendiente de revisión"
        case = self._transition(case, C.ST_PENDIENTE_REVISION, action_user, notes)
        self.repo.update(case_id, case)
        return case

    def iniciar_revision(self, case_id: int, action_user: str) -> dict:
        case = self.repo.get(case_id)
        if not case:
            raise ValueError("Caso no encontrado")
        case = self._transition(case, C.ST_EN_REVISION, action_user, "Sistemas inició revisión")
        self.repo.update(case_id, case)
        return case

    def solicitar_correccion(self, case_id: int, action_user: str, motivo: str) -> dict:
        case = self.repo.get(case_id)
        if not case:
            raise ValueError("Caso no encontrado")
        case = self._transition(case, C.ST_CORRECCION_SOLICITADA, action_user, motivo)
        self.repo.update(case_id, case)
        return case

    def rechazar(self, case_id: int, action_user: str, motivo: str) -> dict:
        case = self.repo.get(case_id)
        if not case:
            raise ValueError("Caso no encontrado")
        case = self._transition(case, C.ST_RECHAZADO, action_user, motivo)
        self.repo.update(case_id, case)
        return case

    def aprobar(self, case_id: int, action_user: str, auth_data: dict) -> dict:
        """Aprueba y genera autorización + sindicato simultáneamente."""
        case = self.repo.get(case_id)
        if not case:
            raise ValueError("Caso no encontrado")

        case = self._transition(case, C.ST_APROBADO, action_user, "Aprobado por Sistemas")

        data = {
            **auth_data,
            "cliente": case["cliente"],
            "vendedor": case["vendedor"],
            "folio": case["official_folio"],
        }
        folder = Path(case["folder_path"])

        auth_bytes, _ = generar_autorizacion_bytes(data)
        sind_bytes, _ = generar_sindicato_bytes(data)

        auth_meta = self.storage.save_document(
            folder, "autorizacion.xlsx", auth_bytes,
            semana=case["semana"], vendedor=case["vendedor"],
            cliente=case["cliente"], folio=case["official_folio"],
            document_type=C.DOC_AUTORIZACION,
        )
        sind_meta = self.storage.save_document(
            folder, "sindicato.xlsx", sind_bytes,
            semana=case["semana"], vendedor=case["vendedor"],
            cliente=case["cliente"], folio=case["official_folio"],
            document_type=C.DOC_SINDICATO,
        )

        case["documentos"].extend([
            {"tipo": C.DOC_AUTORIZACION, "filename": "autorizacion.xlsx", "label": "Autorización", **auth_meta},
            {"tipo": C.DOC_SINDICATO, "filename": "sindicato.xlsx", "label": "Hoja sindicato", **sind_meta},
        ])
        case["autorizacion"] = data

        case = self._transition(case, C.ST_AUTORIZACION_GENERADA, action_user, "autorizacion.xlsx generada")
        case = self._transition(case, C.ST_SINDICATO_GENERADO, action_user, "sindicato.xlsx generada")
        case = self._transition(case, C.ST_ENVIADO_A_COMPULSA, action_user, "Enviado a compulsa")

        self.repo.update(case_id, case)
        return case

    def compulsar(self, case_id: int, action_user: str, observaciones: str = "") -> dict:
        case = self.repo.get(case_id)
        if not case:
            raise ValueError("Caso no encontrado")
        case = self._transition(case, C.ST_COMPULSADO, action_user, observaciones or "Compulsa realizada")
        case = self._transition(case, C.ST_EN_COMPRAS, action_user, "Enviado a Compras")
        self.repo.update(case_id, case)
        return case

    def registrar_compra(
        self,
        case_id: int,
        action_user: str,
        proveedor: str,
        numero_pedido: str | None = None,
        nombre_proveedor: str | None = None,
        observaciones: str = "",
    ) -> dict:
        case = self.repo.get(case_id)
        if not case:
            raise ValueError("Caso no encontrado")

        case["compra"] = {
            "proveedor": proveedor,
            "numero_pedido": numero_pedido,
            "nombre_proveedor": nombre_proveedor,
            "observaciones": observaciones,
            "fecha": datetime.now().isoformat(),
        }
        case = self._transition(case, C.ST_COMPRADO, action_user, f"Compra realizada — {proveedor}")

        notif_result = notificar_compra_realizada(case)
        notif_text = notif_result.get("mensaje", "Compra realizada")
        case.setdefault("notificaciones", []).append({
            "canal": "telegram",
            **notif_result,
        })
        case = self._transition(case, C.ST_NOTIFICADO_VENDEDOR, "sistema", notif_text)
        case = self._transition(case, C.ST_FINALIZADO, "sistema", "Proceso finalizado")

        self.repo.update(case_id, case)
        return case

    def get_document_path(self, case_id: int, filename: str) -> Path | None:
        case = self.repo.get(case_id)
        if not case:
            return None
        return self.storage.get_download_path(Path(case["folder_path"]), filename)

    def dashboard_stats(self) -> dict:
        cases = self.repo.list_all()
        hoy = datetime.now().date().isoformat()

        def count_status(*statuses: str) -> int:
            return sum(1 for c in cases if c.get("estado") in statuses)

        por_estado: dict[str, int] = {}
        for c in cases:
            e = c.get("estado", "desconocido")
            por_estado[e] = por_estado.get(e, 0) + 1

        ventas_vendedor: dict[str, int] = {}
        for c in cases:
            if c.get("estado") == C.ST_FINALIZADO:
                v = c.get("vendedor", "Sin vendedor")
                ventas_vendedor[v] = ventas_vendedor.get(v, 0) + 1

        comprados_hoy = sum(
            1 for c in cases
            if c.get("estado") in (C.ST_COMPRADO, C.ST_NOTIFICADO_VENDEDOR, C.ST_FINALIZADO)
            and (c.get("compra") or {}).get("fecha", "")[:10] == hoy
        )

        capturados_hoy = sum(
            1 for c in cases
            if c.get("case_type") == C.CASE_TYPE_PEDIDO
            and (c.get("created_at") or "")[:10] == hoy
        )

        en_revision = count_status(C.ST_EN_REVISION)

        notificaciones_enviadas = sum(
            len(c.get("notificaciones", []))
            for c in cases
            if c.get("notificaciones")
        )

        actividad = []
        for c in sorted(cases, key=lambda x: x.get("updated_at", ""), reverse=True)[:10]:
            hist = c.get("historial", [])
            if hist:
                last = hist[-1]
                actividad.append({
                    "id": c["id"],
                    "tipo": "pedido",
                    "descripcion": f"{c['public_id']} — {last['new_status']}: {last.get('notes', '')}",
                    "usuario": last.get("action_user", ""),
                    "timestamp": last.get("timestamp", c.get("updated_at", "")),
                })

        documentos = []
        for c in cases:
            for d in c.get("documentos", []):
                documentos.append({
                    "id": f"{c['id']}-{d['tipo']}",
                    "nombre": d.get("filename", d["tipo"]),
                    "tipo": d["tipo"],
                    "cliente": c["cliente"],
                    "folio": c["public_id"],
                    "uploaded_at": c.get("updated_at", ""),
                })
        documentos.sort(key=lambda x: x["uploaded_at"], reverse=True)

        return {
            "pedidos_capturados_hoy": capturados_hoy,
            "en_revision": en_revision,
            "notificaciones_enviadas": notificaciones_enviadas,
            "pedidos_pendientes_revision": count_status(C.ST_PENDIENTE_REVISION, C.ST_EN_REVISION),
            "autorizaciones_generadas": count_status(
                C.ST_AUTORIZACION_GENERADA, C.ST_SINDICATO_GENERADO,
                C.ST_ENVIADO_A_COMPULSA, C.ST_COMPULSADO, C.ST_EN_COMPRAS,
                C.ST_COMPRADO, C.ST_NOTIFICADO_VENDEDOR, C.ST_FINALIZADO,
            ),
            "sindicatos_generados": sum(
                1 for c in cases
                if any(d["tipo"] == C.DOC_SINDICATO for d in c.get("documentos", []))
            ),
            "pendientes_compulsa": count_status(C.ST_ENVIADO_A_COMPULSA),
            "compulsados": count_status(C.ST_COMPULSADO),
            "pendientes_compra": count_status(C.ST_EN_COMPRAS),
            "comprados_hoy": comprados_hoy,
            "ventas_por_vendedor": ventas_vendedor,
            "casos_por_estado": por_estado,
            "actividad_reciente": actividad[:8],
            "documentos_recientes": documentos[:8],
            "total_casos": len(cases),
        }


_case_service: CaseService | None = None


def get_case_service() -> CaseService:
    global _case_service
    if _case_service is None:
        _case_service = CaseService()
    return _case_service