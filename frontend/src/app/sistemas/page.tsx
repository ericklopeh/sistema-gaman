import { SistemasWorkspace } from "@/components/sistemas/SistemasWorkspace";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { getSistemasPendientes } from "@/lib/api";
import { normalizeCasosList } from "@/lib/safe-data";
import type { CasoPedido } from "@/lib/types";

export default async function SistemasPage() {
  let casos: CasoPedido[] = [];
  let loadError: string | null = null;

  try {
    const result = await getSistemasPendientes();
    casos = normalizeCasosList(result.data);
    if (result.fromMock && casos.length === 0) {
      loadError = "No se pudo conectar con la API — verifique que el backend esté activo en el puerto 8010.";
    }
  } catch {
    loadError = "Error al cargar pedidos pendientes de revisión.";
    casos = [];
  }

  const pendientes = casos.filter((c) => c.estado === "PENDIENTE_REVISION");

  return (
    <div>
      <PageHeader
        title="Sistemas"
        description="Pedidos pendientes de revisión — aprobar, corregir o rechazar"
      />

      {loadError && (
        <div className="mb-4">
          <ErrorState message={loadError} />
        </div>
      )}

      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        {pendientes.length} pedido(s) en <strong>PENDIENTE_REVISION</strong> · {casos.length} total en bandeja Sistemas
      </div>

      <ErrorBoundary fallbackMessage="Error al mostrar la bandeja de Sistemas.">
        {casos.length === 0 ? (
          <EmptyState message="No hay casos pendientes de revisión en este momento." />
        ) : (
          <SistemasWorkspace initialCasos={casos} />
        )}
      </ErrorBoundary>
    </div>
  );
}