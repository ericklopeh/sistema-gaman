"use client";

import { Download, Eye } from "lucide-react";
import type { Talon } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface TalonesTableProps {
  talones: Talon[];
}

export function TalonesTable({ talones }: TalonesTableProps) {
  return (
    <DataTable>
      <DataTableHead>
        <DataTableHeader>Folio</DataTableHeader>
        <DataTableHeader>Cliente</DataTableHeader>
        <DataTableHeader>RFC</DataTableHeader>
        <DataTableHeader>Sección</DataTableHeader>
        <DataTableHeader>Vendedor</DataTableHeader>
        <DataTableHeader>Desc. actual</DataTableHeader>
        <DataTableHeader>Desc. nuevo</DataTableHeader>
        <DataTableHeader>Venta posible</DataTableHeader>
        <DataTableHeader>Estado</DataTableHeader>
        <DataTableHeader>Acciones</DataTableHeader>
      </DataTableHead>
      <DataTableBody>
        {talones.map((talon) => (
          <DataTableRow key={talon.id}>
            <DataTableCell className="font-mono text-xs font-medium text-slate-900">
              {talon.folio}
            </DataTableCell>
            <DataTableCell className="font-medium text-slate-900">
              {talon.cliente}
            </DataTableCell>
            <DataTableCell className="font-mono text-xs">{talon.rfc}</DataTableCell>
            <DataTableCell>{talon.seccion}</DataTableCell>
            <DataTableCell>{talon.vendedor}</DataTableCell>
            <DataTableCell>{formatPercent(talon.descuento_actual)}</DataTableCell>
            <DataTableCell className="font-medium text-accent">
              {formatPercent(talon.descuento_nuevo)}
            </DataTableCell>
            <DataTableCell>{formatCurrency(talon.venta_posible)}</DataTableCell>
            <DataTableCell>
              <StatusBadge status={talon.estado} />
            </DataTableCell>
            <DataTableCell>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  onClick={() =>
                    alert(`Generando Excel para ${talon.folio}...`)
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  Generar Excel
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    alert(`Detalle de ${talon.folio}\nCliente: ${talon.cliente}`)
                  }
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver detalle
                </Button>
              </div>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}