import { getCasoByFolio } from "@/lib/api";
import { CasoExpediente } from "@/components/casos/CasoExpediente";
import { notFound } from "next/navigation";

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  const { folio } = await params;
  try {
    const caso = await getCasoByFolio(decodeURIComponent(folio));
    return <CasoExpediente caso={caso} />;
  } catch {
    notFound();
  }
}