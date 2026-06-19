import { PedidosWorkspace } from "@/components/pedidos/PedidosWorkspace";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { getPedidos } from "@/lib/api";
import { normalizePedidosList } from "@/lib/safe-data";
import type { Pedido } from "@/lib/types";

export default async function PedidosPage() {
  let pedidos: Pedido[] = [];
  let loadError: string | null = null;
  let fromMock = false;

  try {
    const result = await getPedidos();
    pedidos = normalizePedidosList(result.data);
    fromMock = result.fromMock;
    if (fromMock) {
      loadError = "API no disponible — mostrando datos de demostración.";
    }
  } catch {
    loadError = "No se pudieron cargar los pedidos. Intente recargar la página.";
    pedidos = [];
  }

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos capturados desde Telegram y web — Mueble o Dinero"
      />

      {loadError && (
        <div className="mb-4">
          <ErrorState message={loadError} />
        </div>
      )}

      <ErrorBoundary fallbackMessage="Error al mostrar el listado de pedidos.">
        <PedidosWorkspace initialPedidos={pedidos} apiUnavailable={fromMock} />
      </ErrorBoundary>
    </div>
  );
}