"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadCasoArchivo } from "@/lib/api";
import type { CasoPedido } from "@/lib/types";
import { formatDateTime, formatEstado } from "@/lib/utils";

interface CasoDetallePanelProps {
  caso: CasoPedido;
}

export function CasoDetallePanel({ caso }: CasoDetallePanelProps) {
  const docs = (caso.documentos ?? []).map((d) =>
    typeof d === "string" ? { tipo: d, filename: d, label: d } : d,
  );

  return (
    <div className="rounded-xl border border-border bg-slate-50 p-4 text-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono font-semibold">{caso.public_id ?? caso.folio}</span>
        <StatusBadge status={caso.estado} />
        <span className="text-muted">{caso.cliente} · {caso.vendedor}</span>
      </div>

      {caso.checklist && (
        <div className="mb-3">
          <p className="mb-1 font-medium text-slate-700">Checklist documentos</p>
          <ul className="space-y-1">
            {caso.checklist.map((item) => (
              <li key={item.tipo} className={item.completo ? "text-emerald-700" : "text-red-600"}>
                {item.completo ? "✅" : "❌"} {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {docs.map((d) => (
          <Button
            key={d.tipo}
            variant="secondary"
            size="sm"
            onClick={() => {
              const fn = d.filename ?? `${d.tipo}.jpg`;
              if (fn.endsWith(".xlsx")) {
                downloadCasoArchivo(caso.id, fn);
              } else {
                downloadCasoArchivo(caso.id, fn).catch(() =>
                  alert(`Documento: ${d.label ?? d.tipo}`),
                );
              }
            }}
          >
            <Download className="h-3 w-3" />
            {d.label ?? formatEstado(d.tipo)}
          </Button>
        ))}
      </div>

      {caso.historial && caso.historial.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-slate-700">Historial</p>
          <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted">
            {caso.historial.slice(-5).map((h, i) => (
              <li key={i}>
                {formatEstado(h.new_status)} — {h.notes} ({formatDateTime(h.timestamp)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {caso.notificaciones && caso.notificaciones.length > 0 && (
        <pre className="mt-3 whitespace-pre-wrap rounded bg-white p-2 text-xs">
          {caso.notificaciones[caso.notificaciones.length - 1].mensaje}
        </pre>
      )}
    </div>
  );
}