"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadCasoArchivo } from "@/lib/api";
import type { CasoPedido } from "@/lib/types";
import { formatDateTime, formatEstado } from "@/lib/utils";

interface CasoExpedienteProps {
  caso: CasoPedido;
  backHref?: string;
}

export function CasoExpediente({ caso, backHref = "/pedidos" }: CasoExpedienteProps) {
  const folio = caso.folio ?? caso.public_id ?? "—";
  const docs = (caso.documentos ?? []).map((d) =>
    typeof d === "string" ? { tipo: d, filename: d, label: d } : d,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="text-sm text-muted hover:text-slate-900">
          <ArrowLeft className="inline h-4 w-4" /> Volver
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expediente {folio}</h1>
          <p className="text-sm text-muted">{caso.cliente}</p>
        </div>
        <StatusBadge status={caso.estado} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold">Datos generales</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Folio oficial</dt><dd>{caso.official_folio ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">RFC</dt><dd>{(caso as CasoPedido & { rfc?: string }).rfc ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Sección</dt><dd>{(caso as CasoPedido & { seccion?: string }).seccion ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Vendedor</dt><dd>{caso.vendedor}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Tipo venta</dt><dd>{formatEstado(caso.order_type ?? caso.tipo_venta ?? "")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Semana</dt><dd>{caso.semana ?? "—"}</dd></div>
          </dl>
          {caso.folder_path && (
            <p className="mt-4 break-all text-xs text-muted">
              <span className="font-medium">Local:</span> {caso.folder_path}
            </p>
          )}
          {(caso as CasoPedido & { sharepoint_path?: string }).sharepoint_path && (
            <p className="mt-2 break-all text-xs text-muted">
              <span className="font-medium">SharePoint (futuro):</span>{" "}
              {(caso as CasoPedido & { sharepoint_path?: string }).sharepoint_path}
            </p>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Documentos</h2>
          {caso.checklist && (
            <ul className="mb-4 space-y-1 text-sm">
              {caso.checklist.map((item) => (
                <li key={item.tipo} className={item.completo ? "text-emerald-700" : "text-amber-600"}>
                  {item.completo ? "✓" : "○"} {item.label}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            {docs.map((d) => (
              <Button
                key={d.tipo}
                variant="secondary"
                size="sm"
                onClick={() => downloadCasoArchivo(caso.id, d.filename ?? `${d.tipo}.jpg`)}
              >
                <Download className="h-3 w-3" />
                {d.label ?? formatEstado(d.tipo)}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Historial</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {(caso.historial ?? []).map((h, i) => (
              <li key={i} className="border-b border-slate-100 pb-2">
                <span className="font-medium">{formatEstado(h.new_status)}</span>
                <span className="text-muted"> — {h.notes}</span>
                <p className="text-xs text-muted">{h.action_user} · {formatDateTime(h.timestamp)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Comentarios</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {((caso as CasoPedido & { comentarios?: string[] }).comentarios ?? []).length === 0 ? (
              <li className="text-muted">Sin comentarios</li>
            ) : (
              ((caso as CasoPedido & { comentarios?: string[] }).comentarios ?? []).map((c, i) => (
                <li key={i} className="rounded bg-slate-50 p-2">{c}</li>
              ))
            )}
          </ul>
          {caso.notificaciones && caso.notificaciones.length > 0 && (
            <div className="mt-4 rounded bg-emerald-50 p-3 text-xs">
              <p className="font-medium text-emerald-800">Última notificación</p>
              <pre className="mt-1 whitespace-pre-wrap text-emerald-700">
                {caso.notificaciones[caso.notificaciones.length - 1].mensaje}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}