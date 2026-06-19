"use client";

import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { CasoDetallePanel } from "@/components/casos/CasoDetallePanel";
import { Button } from "@/components/ui/Button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { comprasRegistrar, getCaso } from "@/lib/api";
import type { CasoPedido } from "@/lib/types";

interface Props {
  initialCasos: CasoPedido[];
}

export function ComprasWorkspace({ initialCasos }: Props) {
  const [casos, setCasos] = useState(initialCasos);
  const [selected, setSelected] = useState<CasoPedido | null>(null);
  const [proveedor, setProveedor] = useState<"Elizondo" | "Otro">("Elizondo");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [nombreProveedor, setNombreProveedor] = useState("");
  const [loading, setLoading] = useState(false);

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
                <Button variant="ghost" onClick={() => getCaso(c.id).then(setSelected)}>
                  <Eye className="h-3.5 w-3.5" /> Ver
                </Button>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>

      {selected && (
        <div className="space-y-4 rounded-xl border border-border bg-white p-6">
          <CasoDetallePanel caso={selected} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Proveedor
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value as "Elizondo" | "Otro")}
              >
                <option value="Elizondo">Elizondo</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            {proveedor === "Elizondo" ? (
              <label className="text-sm">
                Número de pedido
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={numeroPedido}
                  onChange={(e) => setNumeroPedido(e.target.value)}
                  placeholder="Ej. ELZ-2026-4521"
                />
              </label>
            ) : (
              <label className="text-sm">
                Nombre proveedor
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={nombreProveedor}
                  onChange={(e) => setNombreProveedor(e.target.value)}
                />
              </label>
            )}
          </div>
          <Button
            variant="success"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await comprasRegistrar(selected.id, {
                proveedor,
                numero_pedido: proveedor === "Elizondo" ? numeroPedido : undefined,
                nombre_proveedor: proveedor === "Otro" ? nombreProveedor : undefined,
              });
              setCasos((p) => p.filter((x) => x.id !== selected.id));
              const updated = await getCaso(selected.id);
              setSelected(updated);
              setLoading(false);
            }}
          >
            <Check className="h-3.5 w-3.5" /> Marcar compra realizada + notificar vendedor
          </Button>
        </div>
      )}
    </div>
  );
}