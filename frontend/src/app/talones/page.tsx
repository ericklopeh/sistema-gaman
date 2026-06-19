import { getTalones } from "@/lib/api";
import { TalonesWorkspace } from "@/components/talones/TalonesWorkspace";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function TalonesPage() {
  const { data: talones } = await getTalones();

  return (
    <div>
      <PageHeader
        title="Talones"
        description="Revisión, mensaje formal, autorización Excel y hoja sindicato"
      />

      {talones.length === 0 ? (
        <EmptyState message="No hay talones registrados." />
      ) : (
        <TalonesWorkspace initialTalones={talones} />
      )}
    </div>
  );
}