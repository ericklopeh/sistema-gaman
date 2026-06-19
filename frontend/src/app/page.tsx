import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Package,
  Scale,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { getDashboardSummary } from "@/lib/api";
import { safeDashboardSummary } from "@/lib/safe-data";
import { formatDateTime, formatEstado } from "@/lib/utils";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function DashboardPage() {
  let summary = safeDashboardSummary();
  let apiError = false;

  try {
    const result = await getDashboardSummary();
    summary = safeDashboardSummary(result.data);
    apiError = result.fromMock;
  } catch {
    apiError = true;
  }

  const casosEntries = Object.entries(summary.casos_por_estado ?? {}).sort(
    (a, b) => b[1] - a[1],
  );
  const ventasEntries = Object.entries(summary.ventas_por_vendedor ?? {});
  const actividad = summary.actividad_reciente ?? [];
  const documentos = summary.documentos_recientes ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Flujo operativo — captura, revisión, autorización, compulsa y compras"
      />

      {apiError && (
        <div className="mb-4">
          <ErrorState message="API no disponible — mostrando datos de respaldo o parciales." />
        </div>
      )}

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-900">
        Demo operativa — {summary.total_casos ?? 0} casos · flujo captura → sistemas → compulsa → compras
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Capturados hoy"
          value={summary.pedidos_capturados_hoy ?? 0}
          subtitle="Nuevos pedidos"
          icon={Package}
          accent="blue"
        />
        <KpiCard
          title="Pendientes revisión"
          value={summary.pedidos_pendientes_revision ?? 0}
          subtitle="Sistemas"
          icon={Shield}
          accent="amber"
        />
        <KpiCard
          title="En revisión"
          value={summary.en_revision ?? 0}
          subtitle="Sistemas activo"
          icon={Shield}
          accent="amber"
        />
        <KpiCard
          title="Pendientes compulsa"
          value={summary.pendientes_compulsa ?? 0}
          subtitle="Recepción"
          icon={ClipboardCheck}
          accent="violet"
        />
        <KpiCard
          title="Pendientes compra"
          value={summary.pendientes_compra ?? 0}
          subtitle="Compras"
          icon={ShoppingCart}
          accent="blue"
        />
        <KpiCard
          title="Comprados hoy"
          value={summary.comprados_hoy ?? 0}
          subtitle="Finalizados hoy"
          icon={Package}
          accent="emerald"
        />
        <KpiCard
          title="Notificaciones"
          value={summary.notificaciones_enviadas ?? 0}
          subtitle="Telegram / mock"
          icon={Package}
          accent="violet"
        />
        <KpiCard
          title="Compulsados"
          value={summary.compulsados ?? 0}
          subtitle="Recepción"
          icon={ClipboardCheck}
          accent="violet"
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Autorizaciones"
          value={summary.autorizaciones_generadas ?? 0}
          subtitle="Generadas"
          icon={FileText}
          accent="emerald"
        />
        <KpiCard
          title="Sindicatos"
          value={summary.sindicatos_generados ?? 0}
          subtitle="Hojas generadas"
          icon={FileText}
          accent="emerald"
        />
        <KpiCard
          title="Talones pendientes"
          value={summary.talones_pendientes ?? 0}
          subtitle="Revisión talones"
          icon={FileText}
          accent="amber"
        />
        <KpiCard
          title="Diferencias saldos"
          value={summary.diferencias_saldos ?? 0}
          subtitle="Conciliación"
          icon={Scale}
          accent="red"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Casos por estado</h2>
          {casosEntries.length === 0 ? (
            <p className="text-sm text-muted">Sin casos — capture un pedido para iniciar</p>
          ) : (
            <div className="space-y-3">
              {casosEntries.map(([estado, count]) => (
                <div key={estado} className="flex items-center justify-between">
                  <StatusBadge status={estado} />
                  <span className="text-sm font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Ventas por vendedor</h2>
          {ventasEntries.length === 0 ? (
            <p className="text-sm text-muted">Sin ventas finalizadas aún</p>
          ) : (
            <div className="space-y-2">
              {ventasEntries.map(([v, n]) => (
                <div key={v} className="flex justify-between text-sm">
                  <span>{v}</span>
                  <span className="font-semibold">{n}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Actividad reciente</h2>
          {actividad.length === 0 ? (
            <p className="text-sm text-muted">Sin actividad reciente</p>
          ) : (
            <div className="space-y-4">
              {actividad.map((item) => (
                <div key={item?.id ?? item?.descripcion} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{item?.descripcion ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item?.usuario ?? "—"} · {item?.timestamp ? formatDateTime(item.timestamp) : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold text-slate-900">Documentos recientes</h2>
          </div>
          {documentos.length === 0 ? (
            <p className="text-sm text-muted">Sin documentos recientes</p>
          ) : (
            <div className="divide-y divide-border">
              {documentos.map((doc) => (
                <div key={doc?.id ?? doc?.nombre} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc?.nombre ?? "—"}</p>
                    <p className="text-xs text-muted">{doc?.cliente ?? "—"} · {doc?.folio ?? "—"}</p>
                  </div>
                  <span className="text-xs text-muted">{doc?.tipo ? formatEstado(doc.tipo) : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}