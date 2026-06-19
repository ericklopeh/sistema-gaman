"use client";

import { Check, RotateCcw, X } from "lucide-react";
import type { Pedido } from "@/lib/types";
import { formatDocumento, formatEstado } from "@/lib/utils";
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

interface PedidosTableProps {
  pedidos: Pedido[];
}

const ACTIONABLE_STATES = new Set(["en_compulsa", "pendiente_documentos"]);

export function PedidosTable({ pedidos }: PedidosTableProps) {
  const handleAction = (folio: string, action: string) => {
    alert(`Acción "${action}" registrada para ${folio}`);
  };

  return (
    <DataTable>
      <DataTableHead>
        <DataTableHeader>Folio</DataTableHeader>
        <DataTableHeader>Cliente</DataTableHeader>
        <DataTableHeader>Tipo de venta</DataTableHeader>
        <DataTableHeader>Vendedor</DataTableHeader>
        <DataTableHeader>Documentos</DataTableHeader>
        <DataTableHeader>Estado</DataTableHeader>
        <DataTableHeader>Acciones</DataTableHeader>
      </DataTableHead>
      <DataTableBody>
        {pedidos.map((pedido) => (
          <DataTableRow key={pedido.id}>
            <DataTableCell className="font-mono text-xs font-medium text-slate-900">
              {pedido.folio}
            </DataTableCell>
            <DataTableCell>{pedido.cliente}</DataTableCell>
            <DataTableCell className="capitalize">{pedido.tipo_venta}</DataTableCell>
            <DataTableCell>{pedido.vendedor}</DataTableCell>
            <DataTableCell>
              <div className="flex flex-wrap gap-1">
                {pedido.documentos.map((doc) => (
                  <span
                    key={doc}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                  >
                    {formatDocumento(doc)}
                  </span>
                ))}
              </div>
            </DataTableCell>
            <DataTableCell>
              <StatusBadge status={pedido.estado} />
            </DataTableCell>
            <DataTableCell>
              {ACTIONABLE_STATES.has(pedido.estado) ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="success"
                    onClick={() => handleAction(pedido.folio, "Aprobar")}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Aprobar
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => handleAction(pedido.folio, "Corrección")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Corrección
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleAction(pedido.folio, "Rechazar")}
                  >
                    <X className="h-3.5 w-3.5" />
                    Rechazar
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted">{formatEstado(pedido.estado)}</span>
              )}
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}