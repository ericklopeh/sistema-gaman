"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Eye, FileText, X } from "lucide-react";
import { CasoDetallePanel } from "@/components/casos/CasoDetallePanel";
import { Button } from "@/components/ui/Button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getCaso,
  sistemasAprobar,
  sistemasCorregir,
  sistemasRechazar,
  sistemasRevisar,
} from "@/lib/api";
import type { CasoPedido } from "@/lib/types";
import { formatEstado } from "@/lib/utils";

interface Props {
  initialCasos: CasoPedido[];
}

export function SistemasWorkspace({ initialCasos }: Props) {
  const [casos, setCasos] = useState(initialCasos);
  const [selected, setSelected] = useState<CasoPedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const folio = (c: CasoPedido) => c.folio ?? c.public_id ?? `ID-${c.id}`;

  async function refresh(id: number) {
    setError(null);
    try {
      const detail = await getCaso(id);
      setSelected(detail);
      setCasos((prev) => prev.map((c) => (c.id === id ? { ...c, ...detail } : c)));
      return detail;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar detalle");
      return null;
    }
  }

  async function handleVerDetalle(caso: CasoPedido) {
    setLoading(true);
    const detail = await refresh(caso.id);
    if (detail) setSelected(detail);
    setLoading(false);
  }

  async function handleRevisar(caso: CasoPedido) {
    setLoading(true);
    setError(null);
    try {
      await sistemasRevisar(caso.id);
      await refresh(caso.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar revisión");
    } finally {
      setLoading(false);
    }
  }

  async function handleAprobar() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    const hoy = new Date();
    const fecha = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    try {
      await sistemasAprobar(selected.id, {
        telefono: "8140000000",
        fecha,
        semana: 25,
        inicio: `${mes}-${hoy.getFullYear()}`,
        plazo: 72,
        monto_total: 85000,
        productos: [{ producto: "MUEBLE SALA", precio_venta: 85000, tipo_vta: "Nueva" }],
      });
      setCasos((prev) => prev.filter((c) => c.id !== selected.id));
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al aprobar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable>
        <DataTableHead>
          <DataTableHeader>Folio</DataTableHeader>
          <DataTableHeader>Cliente</DataTableHeader>
          <DataTableHeader>Tipo</DataTableHeader>
          <DataTableHeader>Vendedor</DataTableHeader>
          <DataTableHeader>Estado</DataTableHeader>
          <DataTableHeader>Documentos</DataTableHeader>
          <DataTableHeader>Acciones</DataTableHeader>
        </DataTableHead>
        <DataTableBody>
          {casos.map((c) => {
            const checklist = c.checklist ?? [];
            const completos = checklist.filter((i) => i.completo).length;
            const total = checklist.length;
            return (
              <DataTableRow key={c.id}>
                <DataTableCell className="font-mono text-xs">{folio(c)}</DataTableCell>
                <DataTableCell>{c.cliente}</DataTableCell>
                <DataTableCell>{formatEstado(c.order_type ?? c.tipo_venta ?? "—")}</DataTableCell>
                <DataTableCell>{c.vendedor}</DataTableCell>
                <DataTableCell><StatusBadge status={c.estado} /></DataTableCell>
                <DataTableCell className="text-xs text-muted">
                  {total > 0 ? `${completos}/${total} completos` : "—"}
                </DataTableCell>
                <DataTableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" disabled={loading} onClick={() => handleVerDetalle(c)}>
                      <Eye className="h-3.5 w-3.5" /> Ver detalle
                    </Button>
                    <Button variant="secondary" size="sm" disabled={loading} onClick={() => handleVerDetalle(c)}>
                      <FileText className="h-3.5 w-3.5" /> Ver documentos
                    </Button>
                    {c.estado === "PENDIENTE_REVISION" && (
                      <Button variant="primary" size="sm" disabled={loading} onClick={() => handleRevisar(c)}>
                        Revisar
                      </Button>
                    )}
                  </div>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>

      {selected && (
        <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">
              Expediente {folio(selected)}
            </h3>
            <Link
              href={`/expediente/${encodeURIComponent(folio(selected))}`}
              className="text-xs text-accent hover:underline"
            >
              Abrir expediente completo →
            </Link>
          </div>

          <CasoDetallePanel caso={selected} />

          {selected.estado === "EN_REVISION" && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button variant="success" disabled={loading} onClick={handleAprobar}>
                <Check className="h-3.5 w-3.5" /> Aprobar
              </Button>
              <Button
                variant="warning"
                disabled={loading}
                onClick={async () => {
                  const m = prompt("Motivo de corrección:");
                  if (!m) return;
                  setLoading(true);
                  try {
                    await sistemasCorregir(selected.id, m);
                    await refresh(selected.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Error al solicitar corrección");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Solicitar corrección
              </Button>
              <Button
                variant="danger"
                disabled={loading}
                onClick={async () => {
                  const m = prompt("Motivo de rechazo:");
                  if (!m) return;
                  setLoading(true);
                  try {
                    await sistemasRechazar(selected.id, m);
                    setCasos((p) => p.filter((x) => x.id !== selected.id));
                    setSelected(null);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Error al rechazar");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <X className="h-3.5 w-3.5" /> Rechazar
              </Button>
            </div>
          )}

          {selected.estado === "PENDIENTE_REVISION" && (
            <div className="flex gap-2 border-t pt-4">
              <Button variant="primary" disabled={loading} onClick={() => handleRevisar(selected)}>
                Iniciar revisión
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}