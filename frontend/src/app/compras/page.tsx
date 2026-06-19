import { ComprasWorkspace } from "@/components/compras/ComprasWorkspace";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getComprasPendientes } from "@/lib/api";

export default async function ComprasPage() {
  const { data: casos } = await getComprasPendientes();

  return (
    <div>
      <PageHeader
        title="Compras"
        description="Casos compulsados — registrar compra y notificar vendedor"
      />
      {casos.length === 0 ? (
        <EmptyState message="No hay casos pendientes de compra." />
      ) : (
        <ComprasWorkspace initialCasos={casos} />
      )}
    </div>
  );
}