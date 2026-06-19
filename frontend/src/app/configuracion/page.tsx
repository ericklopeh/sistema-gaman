import { Brain, Cloud, Database, MessageCircle, RefreshCw, Server, Sliders } from "lucide-react";
import { getDemoStatus } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfigActions } from "@/components/config/ConfigActions";
import { HorarioOperativoSection } from "@/components/config/HorarioOperativoSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

export default async function ConfiguracionPage() {
  let status: Record<string, unknown> = {};
  try {
    status = await getDemoStatus();
  } catch {
    status = { demo_mode: true, error: "Backend no disponible" };
  }

  const integraciones = [
    {
      id: "telegram",
      title: "Telegram",
      icon: MessageCircle,
      ok: Boolean(status.telegram_configured),
      note: status.telegram_configured ? "Token configurado" : "Simulador web / mock notificaciones",
    },
    {
      id: "sharepoint",
      title: "SharePoint",
      icon: Cloud,
      ok: Boolean(status.sharepoint_enabled),
      note: "Estructura local + mirror — Graph API pendiente",
    },
    {
      id: "postgresql",
      title: "PostgreSQL",
      icon: Database,
      ok: false,
      note: String(status.postgresql ?? "pendiente"),
    },
    {
      id: "erp",
      title: "ERP",
      icon: RefreshCw,
      ok: false,
      note: String(status.erp ?? "pendiente"),
    },
    {
      id: "ia",
      title: "IA / RAG",
      icon: Brain,
      ok: false,
      note: String(status.ia_rag ?? "mock"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Estado del sistema demo y integraciones futuras"
      />

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Modo demo activo</strong> — usuarios semilla, LocalStorageProvider, respuestas mock IA/Telegram.
      </div>

      <div className="mb-6">
        <HorarioOperativoSection />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Sistema</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">DEMO_MODE</dt><dd><StatusBadge status={status.demo_mode ? "FINALIZADO" : "pendiente"} /></dd></div>
            <div className="flex justify-between"><dt className="text-muted">Backend</dt><dd className="font-mono text-xs">{API_URL}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Storage</dt><dd>{String(status.storage_provider ?? "local")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Casos demo</dt><dd>{String(status.total_casos ?? 0)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Frontend</dt><dd>:3010</dd></div>
          </dl>
          <ConfigActions />
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold">Integraciones</h2>
          </div>
          <div className="space-y-3">
            {integraciones.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">{item.title}</p>
                      <StatusBadge status={item.ok ? "APROBADO" : "pendiente"} />
                    </div>
                    <p className="text-xs text-muted">{item.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}