import Link from "next/link";
import { Download } from "lucide-react";
import { getDocumentos } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/ui/DataTable";
import { formatDateTime, formatEstado } from "@/lib/utils";

export default async function DocumentosPage() {
  const { data: docs } = await getDocumentos();

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Archivos generados y cargados por caso — almacenamiento local con ruta SharePoint futura"
      />

      <DataTable>
        <DataTableHead>
          <DataTableHeader>Folio</DataTableHeader>
          <DataTableHeader>Cliente</DataTableHeader>
          <DataTableHeader>Tipo</DataTableHeader>
          <DataTableHeader>Archivo</DataTableHeader>
          <DataTableHeader>Fecha</DataTableHeader>
          <DataTableHeader>Acciones</DataTableHeader>
        </DataTableHead>
        <DataTableBody>
          {docs.map((doc) => (
            <DataTableRow key={doc.id}>
              <DataTableCell className="font-mono text-xs">
                <Link href={`/expediente/${doc.folio}`} className="text-accent hover:underline">
                  {doc.folio}
                </Link>
              </DataTableCell>
              <DataTableCell>{doc.cliente}</DataTableCell>
              <DataTableCell>{doc.label ?? formatEstado(doc.tipo_documento)}</DataTableCell>
              <DataTableCell className="max-w-[200px] truncate text-xs text-muted">
                {doc.filename}
              </DataTableCell>
              <DataTableCell className="text-xs">{formatDateTime(doc.fecha)}</DataTableCell>
              <DataTableCell>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010"}/api/cases/${doc.case_id}/download/${doc.filename}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  download
                >
                  <Download className="h-3 w-3" /> Descargar
                </a>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {docs.length > 0 && (
        <p className="mt-4 text-xs text-muted">
          Ruta local y SharePoint visible en expediente de cada caso.
        </p>
      )}
    </div>
  );
}