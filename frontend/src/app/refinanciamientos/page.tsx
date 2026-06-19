import { getRefinanciamientos } from "@/lib/api";
import { RefinanciamientosTable } from "@/components/refinanciamientos/RefinanciamientosTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function RefinanciamientosPage() {
  const { data: refinanciamientos, fromMock } = await getRefinanciamientos();

  return (
    <div>
      <PageHeader
        title="Refinanciamientos"
        description="Seguimiento de saldos y elegibilidad para refinanciar"
      />

      {fromMock && <MockDataBanner />}

      {refinanciamientos.length === 0 ? (
        <EmptyState message="No hay refinanciamientos registrados." />
      ) : (
        <RefinanciamientosTable refinanciamientos={refinanciamientos} />
      )}
    </div>
  );
}