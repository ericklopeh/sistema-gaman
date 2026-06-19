"use client";

import { FileCheck } from "lucide-react";
import type { Refinanciamiento } from "@/lib/types";
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

interface RefinanciamientosTableProps {
  refinanciamientos: Refinanciamiento[];
}

export function RefinanciamientosTable({ refinanciamientos }: RefinanciamientosTableProps) {
  return (
    <DataTable>
      <DataTableHead>
        <DataTableHeader>Cliente</DataTableHeader>
        <DataTableHeader>Venta original</DataTableHeader>
        <DataTableHeader>Saldo</DataTableHeader>
        <DataTableHeader>Pagado</DataTableHeader>
        <DataTableHeader>% pagado</DataTableHeader>
        <DataTableHeader>Elegible</DataTableHeader>
        <DataTableHeader>Estado</DataTableHeader>
        <DataTableHeader>Acciones</DataTableHeader>
      </DataTableHead>
      <DataTableBody>
        {refinanciamientos.map((item) => (
          <DataTableRow key={item.id}>
            <DataTableCell className="font-medium text-slate-900">
              {item.cliente}
            </DataTableCell>
            <DataTableCell className="font-mono text-xs">{item.venta_original}</DataTableCell>
            <DataTableCell>{formatCurrency(item.saldo)}</DataTableCell>
            <DataTableCell>{formatCurrency(item.pagado)}</DataTableCell>
            <DataTableCell>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(item.porcentaje_pagado, 100)}%` }}
                  />
                </div>
                <span className="text-xs">{formatPercent(item.porcentaje_pagado)}</span>
              </div>
            </DataTableCell>
            <DataTableCell>
              <span
                className={
                  item.elegible
                    ? "text-xs font-medium text-emerald-600"
                    : "text-xs font-medium text-slate-400"
                }
              >
                {item.elegible ? "Sí" : "No"}
              </span>
            </DataTableCell>
            <DataTableCell>
              <StatusBadge status={item.estado} />
            </DataTableCell>
            <DataTableCell>
              <Button
                variant="primary"
                disabled={!item.elegible}
                onClick={() =>
                  alert(`Generando autorización para ${item.cliente}...`)
                }
              >
                <FileCheck className="h-3.5 w-3.5" />
                Generar autorización
              </Button>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}