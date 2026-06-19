"use client";

import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { CasoDetallePanel } from "@/components/casos/CasoDetallePanel";
import { Button } from "@/components/ui/Button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { compulsaMarcar, downloadCasoArchivo, getCaso } from "@/lib/api";
import type { CasoPedido } from "@/lib/types";

interface Props {
  initialCasos: CasoPedido[];
}

export function CompulsaWorkspace({ initialCasos }: Props) {
  const [casos, setCasos] = useState(initialCasos);
  const [selected, setSelected] = useState<CasoPedido | null>(null);
  const [loading, setLoading] = useState(false);

  async function select(id: number) {
    const detail = await getCaso(id);
    setSelected(detail);
  }

  return (
    <div className="space-y-6">
      <DataTable>
        <DataTableHead>
          <DataTableHeader>Folio</DataTableHeader>
          <DataTableHeader>Cliente</DataTableHeader>
          <DataTableHeader>Vendedor</DataTableHeader>
          <DataTableHeader>Estado</DataTableHeader>
          <DataTableHeader>Acciones</DataTableHeader>
        </DataTableHead>
        <DataTableBody>
          {casos.map((c) => (
            <DataTableRow key={c.id}>
              <DataTableCell className="font-mono text-xs">{c.public_id ?? c.folio}</DataTableCell>
              <DataTableCell>{c.cliente}</DataTableCell>
              <DataTableCell>{c.vendedor}</DataTableCell>
              <DataTableCell><StatusBadge status={c.estado} /></DataTableCell>
              <DataTableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => select(c.id)}><Eye className="h-3.5 w-3.5" /> Ver</Button>
                  <Button variant="secondary" onClick={() => downloadCasoArchivo(c.id, "autorizacion.xlsx")}>Autorización</Button>
                  <Button variant="secondary" onClick={() => downloadCasoArchivo(c.id, "sindicato.xlsx")}>Sindicato</Button>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {selected && (
        <div className="space-y-4">
          <CasoDetallePanel caso={selected} />
          <Button
            variant="success"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const obs = prompt("Observaciones de compulsa (opcional):") ?? "";
              await compulsaMarcar(selected.id, obs);
              setCasos((p) => p.filter((x) => x.id !== selected.id));
              setSelected(null);
              setLoading(false);
            }}
          >
            <Check className="h-3.5 w-3.5" /> Marcar compulsado
          </Button>
        </div>
      )}
    </div>
  );
}