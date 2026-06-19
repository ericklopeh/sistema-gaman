"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { getReportesSummary } from "@/lib/api";
import type { ReportesSummary } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";


export default function ReportesPage() {
  const [data, setData] = useState<ReportesSummary | null>(null);

  useEffect(() => {
    getReportesSummary().then((r) => setData(r.data));
  }, []);

  function exportDemo() {
    if (!data) return;
    const rows = [
      ["Reporte GAMAN Demo", new Date().toISOString()],
      [],
      ["Pedidos por estado"],
      ...Object.entries(data.pedidos_por_estado).map(([k, v]) => [k, String(v)]),
      [],
      ["Ventas por vendedor"],
      ...Object.entries(data.ventas_por_vendedor).map(([k, v]) => [k, String(v)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_gaman_demo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data) {
    return <PageHeader title="Reportes" description="Cargando..." />;
  }

  const cards = [
    { label: "Pendientes compulsa", value: data.pendientes_compulsa },
    { label: "Pendientes compras", value: data.pendientes_compras },
    { label: "Comprados hoy", value: data.comprados_hoy },
    { label: "Saldos con diferencia", value: data.saldos_con_diferencia },
    { label: "Refinanc. elegibles", value: data.refinanciamientos_elegibles },
    { label: "Docs incompletos", value: data.documentos_incompletos },
  ];

  return (
    <div>
      <PageHeader title="Reportes" description="Análisis operativo demo — exportación CSV">
        <button
          type="button"
          onClick={exportDemo}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          <Download className="h-4 w-4" /> Exportar Excel demo
        </button>
      </PageHeader>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Pedidos por estado</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(data.pedidos_por_estado).map(([estado, n]) => (
              <div key={estado} className="flex justify-between text-sm">
                <StatusBadge status={estado} />
                <span className="font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Ventas por vendedor</h2>
          {Object.keys(data.ventas_por_vendedor).length === 0 ? (
            <p className="text-sm text-muted">Sin ventas finalizadas en semilla</p>
          ) : (
            Object.entries(data.ventas_por_vendedor).map(([v, n]) => (
              <div key={v} className="flex justify-between border-b py-2 text-sm">
                <span>{v}</span>
                <span className="font-semibold">{n}</span>
              </div>
            ))
          )}
        </section>
      </div>

      {(data.comprados_hoy_detalle ?? []).length > 0 && (
        <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Comprados del día</h2>
          <ul className="text-sm">
            {data.comprados_hoy_detalle!.map((c) => (
              <li key={c.folio}>{c.folio} — {c.cliente} ({c.vendedor})</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}