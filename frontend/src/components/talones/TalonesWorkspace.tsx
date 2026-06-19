"use client";

import { useCallback, useState } from "react";
import { Download, Eye, FileSpreadsheet, Plus } from "lucide-react";
import { NuevaRevisionForm } from "@/components/talones/NuevaRevisionForm";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  downloadTalonArchivo,
  generarAutorizacion,
  getTalonDetail,
} from "@/lib/api";
import type { Talon, TalonDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface TalonesWorkspaceProps {
  initialTalones: Talon[];
}

export function TalonesWorkspace({ initialTalones }: TalonesWorkspaceProps) {
  const [talones, setTalones] = useState(initialTalones);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<TalonDetail | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const refreshSelected = useCallback(async (id: number) => {
    const detail = await getTalonDetail(id);
    setSelected(detail);
    setTalones((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...detail } : t)),
    );
  }, []);

  function handleCreated(talon: TalonDetail) {
    setTalones((prev) => [talon, ...prev]);
    setSelected(talon);
    setShowForm(false);
  }

  async function handleView(talon: Talon) {
    try {
      const detail = await getTalonDetail(talon.id);
      setSelected(detail);
    } catch {
      alert(
        "Este talón es de datos demo. Cree una nueva revisión para usar el flujo completo.",
      );
    }
  }

  async function handleGenerarAutorizacion() {
    if (!selected) return;
    setLoadingAuth(true);
    try {
      const hoy = new Date();
      const fecha = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
      const mes = String(hoy.getMonth() + 1).padStart(2, "0");
      const anio = hoy.getFullYear();
      const monto = selected.venta_posible > 0 ? selected.venta_posible : 50000;

      await generarAutorizacion(selected.id, {
        telefono: "8140000000",
        fecha,
        folio: selected.folio.replace("REV-", ""),
        semana: 25,
        inicio: `${mes}-${anio}`,
        plazo: 72,
        monto_total: monto,
        observaciones: selected.mensaje_vendedor?.slice(0, 200) ?? "",
        productos: [
          {
            producto: "MUEBLE SALA",
            trans_credito: monto,
            credito: 0,
            precio_venta: monto,
            descuento: 0,
            tipo_vta: "Nueva",
          },
        ],
      });
      await refreshSelected(selected.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al generar autorización");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleDownload(tipo: "revision" | "autorizacion" | "sindicato") {
    if (!selected) return;
    try {
      await downloadTalonArchivo(selected.id, tipo);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al descargar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {talones.length} talones registrados
        </p>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          Nueva revisión
        </Button>
      </div>

      {showForm && (
        <NuevaRevisionForm
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      <DataTable>
        <DataTableHead>
          <DataTableHeader>Folio</DataTableHeader>
          <DataTableHeader>Cliente</DataTableHeader>
          <DataTableHeader>RFC</DataTableHeader>
          <DataTableHeader>Sección</DataTableHeader>
          <DataTableHeader>Vendedor</DataTableHeader>
          <DataTableHeader>Desc. actual</DataTableHeader>
          <DataTableHeader>Desc. nuevo</DataTableHeader>
          <DataTableHeader>Venta posible</DataTableHeader>
          <DataTableHeader>Estado</DataTableHeader>
          <DataTableHeader>Acciones</DataTableHeader>
        </DataTableHead>
        <DataTableBody>
          {talones.map((talon) => (
            <DataTableRow key={talon.id}>
              <DataTableCell className="font-mono text-xs font-medium text-slate-900">
                {talon.folio}
              </DataTableCell>
              <DataTableCell className="font-medium text-slate-900">
                {talon.cliente}
              </DataTableCell>
              <DataTableCell className="font-mono text-xs">{talon.rfc}</DataTableCell>
              <DataTableCell>{talon.seccion}</DataTableCell>
              <DataTableCell>{talon.vendedor}</DataTableCell>
              <DataTableCell>{formatCurrency(talon.descuento_actual)}</DataTableCell>
              <DataTableCell className="font-medium text-accent">
                {formatCurrency(talon.descuento_nuevo)}
              </DataTableCell>
              <DataTableCell>{formatCurrency(talon.venta_posible)}</DataTableCell>
              <DataTableCell>
                <StatusBadge status={talon.estado} />
              </DataTableCell>
              <DataTableCell>
                <Button variant="ghost" onClick={() => handleView(talon)}>
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </Button>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {selected && (
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {selected.folio} — {selected.cliente}
              </h3>
              <p className="text-sm text-slate-500">
                Liquidez calculada · Venta posible (72):{" "}
                {formatCurrency(selected.venta_posible)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => handleDownload("revision")}
                disabled={!selected.revision_excel}
              >
                <Download className="h-3.5 w-3.5" />
                Excel revisión
              </Button>
              <Button
                variant="warning"
                onClick={handleGenerarAutorizacion}
                disabled={loadingAuth}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {loadingAuth ? "Generando..." : "Generar autorización"}
              </Button>
              <Button
                variant="success"
                onClick={() => handleDownload("autorizacion")}
                disabled={!selected.autorizacion_excel}
              >
                <Download className="h-3.5 w-3.5" />
                Descargar Excel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownload("sindicato")}
                disabled={!selected.sindicato_excel}
              >
                <Download className="h-3.5 w-3.5" />
                Hoja sindicato
              </Button>
            </div>
          </div>

          {selected.mensaje_vendedor && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">
                Mensaje formal al vendedor
              </h4>
              <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
                {selected.mensaje_vendedor}
              </pre>
            </div>
          )}

          {selected.resumen_refinanciamiento && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Descuento nuevo</p>
                <p className="text-lg font-semibold text-accent">
                  {formatCurrency(selected.resumen_refinanciamiento.total_abono_nuevo)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Venta posible (72)</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(
                    selected.resumen_refinanciamiento.simulacion?.[72]?.["VENTA POSIBLE"] ?? 0,
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Liquidez final</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(
                    (selected.revision?.liquidez_final as number | undefined) ?? 0,
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}