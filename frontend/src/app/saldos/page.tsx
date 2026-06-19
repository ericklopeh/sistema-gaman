import { getSaldos } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/DataTable";

export default async function SaldosPage() {
  const { data: saldos, fromMock } = await getSaldos();

  return (
    <div>
      <PageHeader
        title="Saldos"
        description="Conciliación entre saldos del sistema y cálculo operativo"
      />

      {fromMock && <MockDataBanner />}

      {saldos.length === 0 ? (
        <EmptyState message="No hay saldos registrados." />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeader>Factura</DataTableHeader>
            <DataTableHeader>Cliente</DataTableHeader>
            <DataTableHeader>Saldo sistema</DataTableHeader>
            <DataTableHeader>Saldo calculado</DataTableHeader>
            <DataTableHeader>Diferencia</DataTableHeader>
            <DataTableHeader>Estado</DataTableHeader>
          </DataTableHead>
          <DataTableBody>
            {saldos.map((saldo) => (
              <DataTableRow key={saldo.id}>
                <DataTableCell className="font-mono text-xs font-medium text-slate-900">
                  {saldo.factura}
                </DataTableCell>
                <DataTableCell>{saldo.cliente}</DataTableCell>
                <DataTableCell>{formatCurrency(saldo.saldo_sistema)}</DataTableCell>
                <DataTableCell>{formatCurrency(saldo.saldo_calculado)}</DataTableCell>
                <DataTableCell
                  className={
                    saldo.diferencia !== 0
                      ? "font-medium text-red-600"
                      : "text-emerald-600"
                  }
                >
                  {formatCurrency(saldo.diferencia)}
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge status={saldo.estado} />
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}