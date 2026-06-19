import { CompulsaWorkspace } from "@/components/compulsa/CompulsaWorkspace";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCompulsaPendientes } from "@/lib/api";

export default async function CompulsaPage() {
  const { data: casos } = await getCompulsaPendientes();

  return (
    <div>
      <PageHeader
        title="Compulsa"
        description="Casos con autorización y sindicato listos para compulsa"
      />
      {casos.length === 0 ? (
        <EmptyState message="No hay casos pendientes de compulsa." />
      ) : (
        <CompulsaWorkspace initialCasos={casos} />
      )}
    </div>
  );
}