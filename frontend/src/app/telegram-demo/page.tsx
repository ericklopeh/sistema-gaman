import { PageHeader } from "@/components/ui/PageHeader";
import { TelegramSimulator } from "@/components/telegram/TelegramSimulator";

export default function TelegramDemoPage() {
  return (
    <div>
      <PageHeader
        title="Telegram — Simulador"
        description="Canal de captura y consulta para vendedores. Usa el bot real (telegram_bot/) si hay TELEGRAM_BOT_TOKEN."
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <TelegramSimulator />
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Comandos disponibles</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li><code>/start</code> — Bienvenida</li>
            <li><code>/nuevo_pedido</code> — Captura Mueble o Dinero con fotos demo</li>
            <li><code>/mis_pedidos</code> — Lista de pedidos del vendedor</li>
            <li><code>/mis_pendientes</code> — Casos activos</li>
            <li><code>/mis_ventas_hoy</code> — Ventas del día</li>
            <li><code>/estatus</code> — Resumen por estado</li>
          </ul>
          <h3 className="mt-6 mb-2 text-sm font-semibold">Flujo presentación</h3>
          <ol className="list-decimal space-y-1 pl-4 text-sm text-muted">
            <li>Iniciar sesión como vendedor@gaman.local</li>
            <li>/nuevo_pedido → cliente → Mueble → foto (x2)</li>
            <li>Cambiar a sistemas@gaman.local → /sistemas → aprobar</li>
            <li>recepcion → /compulsa → compras → /compras</li>
            <li>Volver aquí → /estatus</li>
          </ol>
        </section>
      </div>
    </div>
  );
}