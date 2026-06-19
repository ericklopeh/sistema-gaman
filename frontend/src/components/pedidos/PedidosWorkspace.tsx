"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/components/auth/AuthProvider";
import { OutOfHoursBanner } from "@/components/ui/OutOfHoursBanner";
import { useHorarioOperativo } from "@/hooks/useHorarioOperativo";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { capturarPedido, getPedidos } from "@/lib/api";
import { canVendedorCapture, parseApiErrorMessage } from "@/lib/business-hours";
import type { Pedido } from "@/lib/types";
import { formatEstado } from "@/lib/utils";

const VENDEDORES_DEMO = [
  "Leonardo Arévalo", "Juan Manuel", "Gerardo Santana", "Eliezer Chipuli", "Sergio Vázquez",
];

export function PedidosWorkspace({
  initialPedidos,
  apiUnavailable = false,
}: {
  initialPedidos: Pedido[];
  apiUnavailable?: boolean;
}) {
  const { user } = useAuth();
  const { horario } = useHorarioOperativo();
  const puedeCapturar = canVendedorCapture(user?.role, horario);
  const [pedidos, setPedidos] = useState(initialPedidos);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [form, setForm] = useState({
    cliente: "Patricia Morales López",
    order_type: "mueble",
    vendedor: "Eliezer Chipuli",
  });

  const filtrados = useMemo(() => pedidos.filter((p) => {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (filtroVendedor && p.vendedor !== filtroVendedor) return false;
    if (filtroTipo && p.tipo_venta !== filtroTipo) return false;
    return true;
  }), [pedidos, filtroEstado, filtroVendedor, filtroTipo]);

  const estados = useMemo(() => [...new Set(pedidos.map((p) => p.estado))].sort(), [pedidos]);

  async function handleCaptura(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append("cliente", form.cliente);
    fd.append("order_type", form.order_type);
    fd.append("vendedor", form.vendedor);
    fd.append("semana", "25");
    if (!puedeCapturar) return;
    try {
      setListError(null);
      await capturarPedido(fd, user?.role);
      const { data } = await getPedidos();
      setPedidos(data);
      setShowForm(false);
    } catch (err) {
      setListError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Captura web y canal Telegram — {filtrados.length} de {pedidos.length} pedidos
        </p>
        {puedeCapturar && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5" /> Nuevo pedido
          </Button>
        )}
      </div>

      {!puedeCapturar && user?.role === "VENDEDOR" && (
        <OutOfHoursBanner />
      )}

      <div className="flex flex-wrap gap-3">
        <select className="rounded-lg border px-3 py-2 text-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e} value={e}>{formatEstado(e)}</option>)}
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm" value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}>
          <option value="">Todos los vendedores</option>
          {VENDEDORES_DEMO.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="mueble">Mueble</option>
          <option value="dinero">Dinero</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCaptura} className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Capturar pedido</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <input className="rounded-lg border px-3 py-2" placeholder="Cliente" value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
            <select className="rounded-lg border px-3 py-2" value={form.order_type}
              onChange={(e) => setForm({ ...form, order_type: e.target.value })}>
              <option value="mueble">Mueble</option>
              <option value="dinero">Dinero</option>
            </select>
            <select className="rounded-lg border px-3 py-2" value={form.vendedor}
              onChange={(e) => setForm({ ...form, vendedor: e.target.value })}>
              {VENDEDORES_DEMO.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <Button type="submit" variant="primary" className="mt-4" disabled={loading}>
            {loading ? "Capturando..." : "Capturar y crear caso"}
          </Button>
        </form>
      )}

      {listError && <ErrorState message={listError} />}

      {apiUnavailable && pedidos.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Mostrando datos de demostración — conecte el backend para ver pedidos reales de Telegram.
        </div>
      )}

      {filtrados.length === 0 ? (
        <EmptyState
          message={
            pedidos.length === 0
              ? "Aún no hay pedidos. Capture uno desde Telegram (/nuevo_pedido) o use el formulario web."
              : "Ningún pedido coincide con los filtros seleccionados."
          }
        />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeader>Folio</DataTableHeader>
            <DataTableHeader>Cliente</DataTableHeader>
            <DataTableHeader>Tipo</DataTableHeader>
            <DataTableHeader>Vendedor</DataTableHeader>
            <DataTableHeader>Estado</DataTableHeader>
            <DataTableHeader>Docs</DataTableHeader>
            <DataTableHeader>Expediente</DataTableHeader>
          </DataTableHead>
          <DataTableBody>
            {filtrados.map((p) => (
              <DataTableRow key={p.id}>
                <DataTableCell className="font-mono text-xs">{p.folio ?? "—"}</DataTableCell>
                <DataTableCell>{p.cliente ?? "—"}</DataTableCell>
                <DataTableCell>{formatEstado(p.tipo_venta ?? "—")}</DataTableCell>
                <DataTableCell>{p.vendedor ?? "—"}</DataTableCell>
                <DataTableCell><StatusBadge status={p.estado ?? "DESCONOCIDO"} /></DataTableCell>
                <DataTableCell className="text-xs text-muted">
                  {(p.documentos?.length ?? 0) > 0
                    ? p.documentos?.join(", ")
                    : p.checklist?.some((c) => !c.completo)
                      ? "Incompleto"
                      : "—"}
                </DataTableCell>
                <DataTableCell>
                  {p.folio ? (
                    <Link href={`/expediente/${p.folio}`} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </Link>
                  ) : (
                    "—"
                  )}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}