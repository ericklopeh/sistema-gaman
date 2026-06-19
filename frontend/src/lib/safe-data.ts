import type { CasoPedido, DashboardSummary, Pedido } from "./types";

const EMPTY_DASHBOARD: DashboardSummary = {
  talones_pendientes: 0,
  pedidos_activos: 0,
  refinanciamientos: 0,
  diferencias_saldos: 0,
  pedidos_capturados_hoy: 0,
  en_revision: 0,
  notificaciones_enviadas: 0,
  pedidos_pendientes_revision: 0,
  autorizaciones_generadas: 0,
  sindicatos_generados: 0,
  pendientes_compulsa: 0,
  compulsados: 0,
  pendientes_compra: 0,
  comprados_hoy: 0,
  ventas_por_vendedor: {},
  casos_por_estado: {},
  actividad_reciente: [],
  documentos_recientes: [],
  total_casos: 0,
};

export function safeDashboardSummary(data?: Partial<DashboardSummary> | null): DashboardSummary {
  const d = data ?? {};
  return {
    ...EMPTY_DASHBOARD,
    ...d,
    ventas_por_vendedor: d.ventas_por_vendedor ?? {},
    casos_por_estado: d.casos_por_estado ?? {},
    actividad_reciente: Array.isArray(d.actividad_reciente) ? d.actividad_reciente : [],
    documentos_recientes: Array.isArray(d.documentos_recientes) ? d.documentos_recientes : [],
    talones_pendientes: d.talones_pendientes ?? 0,
    pedidos_activos: d.pedidos_activos ?? 0,
    refinanciamientos: d.refinanciamientos ?? 0,
    diferencias_saldos: d.diferencias_saldos ?? 0,
    pedidos_pendientes_revision: d.pedidos_pendientes_revision ?? 0,
    autorizaciones_generadas: d.autorizaciones_generadas ?? 0,
    sindicatos_generados: d.sindicatos_generados ?? 0,
    pendientes_compulsa: d.pendientes_compulsa ?? 0,
    compulsados: d.compulsados ?? 0,
    pendientes_compra: d.pendientes_compra ?? 0,
    comprados_hoy: d.comprados_hoy ?? 0,
  };
}

export function normalizeCaso(raw: Record<string, unknown>): CasoPedido {
  const docs = raw.documentos;
  const documentos = Array.isArray(docs)
    ? docs.map((d) =>
        typeof d === "string"
          ? { tipo: d, filename: d, label: d }
          : {
              tipo: String((d as { tipo?: string }).tipo ?? ""),
              filename: (d as { filename?: string }).filename,
              label: (d as { label?: string }).label,
            },
      )
    : [];

  return {
    id: Number(raw.id ?? 0),
    public_id: (raw.public_id as string) ?? (raw.folio as string),
    folio: (raw.folio as string) ?? (raw.public_id as string),
    cliente: String(raw.cliente ?? "—"),
    order_type: (raw.order_type as string) ?? (raw.tipo_venta as string),
    tipo_venta: (raw.tipo_venta as string) ?? (raw.order_type as string),
    vendedor: String(raw.vendedor ?? "—"),
    estado: String(raw.estado ?? "DESCONOCIDO"),
    official_folio: raw.official_folio as string | undefined,
    semana: raw.semana as string | undefined,
    documentos,
    checklist: Array.isArray(raw.checklist) ? raw.checklist : [],
    historial: Array.isArray(raw.historial) ? raw.historial : [],
    autorizacion: raw.autorizacion,
    compra: (raw.compra as CasoPedido["compra"]) ?? null,
    notificaciones: Array.isArray(raw.notificaciones) ? raw.notificaciones : [],
    folder_path: raw.folder_path as string | undefined,
  };
}

export function normalizePedido(raw: Record<string, unknown>): Pedido {
  const docs = raw.documentos;
  return {
    id: Number(raw.id ?? 0),
    folio: String(raw.folio ?? raw.public_id ?? "—"),
    cliente: String(raw.cliente ?? "—"),
    tipo_venta: String(raw.tipo_venta ?? raw.order_type ?? "mueble"),
    vendedor: String(raw.vendedor ?? "—"),
    documentos: Array.isArray(docs) ? docs.map(String) : [],
    estado: String(raw.estado ?? "DESCONOCIDO"),
    checklist: Array.isArray(raw.checklist) ? raw.checklist : [],
  };
}

export function normalizeCasosList(items: unknown): CasoPedido[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => normalizeCaso(item));
}

export function normalizePedidosList(items: unknown): Pedido[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => normalizePedido(item));
}