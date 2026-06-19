export interface DashboardSummary {
  talones_pendientes: number;
  pedidos_activos: number;
  refinanciamientos: number;
  diferencias_saldos: number;
  pedidos_capturados_hoy?: number;
  en_revision?: number;
  notificaciones_enviadas?: number;
  pedidos_pendientes_revision: number;
  autorizaciones_generadas: number;
  sindicatos_generados: number;
  pendientes_compulsa: number;
  compulsados: number;
  pendientes_compra: number;
  comprados_hoy: number;
  ventas_por_vendedor: Record<string, number>;
  casos_por_estado: Record<string, number>;
  actividad_reciente: ActivityItem[];
  documentos_recientes: DocumentItem[];
  total_casos?: number;
}

export interface ActivityItem {
  id: number;
  tipo: string;
  descripcion: string;
  usuario: string;
  timestamp: string;
}

export interface DocumentItem {
  id: number | string;
  nombre: string;
  tipo: string;
  cliente: string;
  folio: string;
  uploaded_at: string;
}

export interface DocumentoItem {
  id: string;
  folio: string;
  official_folio?: string;
  cliente: string;
  vendedor: string;
  tipo_documento: string;
  label: string;
  filename?: string;
  fecha: string;
  ruta_local: string;
  ruta_sharepoint: string;
  case_id: number;
}

export interface ReportesSummary {
  pedidos_por_estado: Record<string, number>;
  ventas_por_vendedor: Record<string, number>;
  pendientes_compulsa: number;
  pendientes_compras: number;
  comprados_hoy: number;
  saldos_con_diferencia: number;
  refinanciamientos_elegibles: number;
  documentos_incompletos: number;
  total_pedidos: number;
  comprados_hoy_detalle?: Array<{ folio: string; cliente: string; vendedor: string }>;
}

export interface ChecklistItem {
  tipo: string;
  label: string;
  completo: boolean;
}

export interface CasoPedido {
  id: number;
  public_id?: string;
  folio?: string;
  cliente: string;
  order_type?: string;
  tipo_venta?: string;
  vendedor: string;
  estado: string;
  official_folio?: string;
  semana?: string;
  documentos: Array<{ tipo: string; filename?: string; label?: string } | string>;
  checklist?: ChecklistItem[];
  historial?: HistorialEntry[];
  autorizacion?: unknown;
  compra?: CompraInfo | null;
  notificaciones?: Notificacion[];
  folder_path?: string;
}

export interface HistorialEntry {
  old_status: string | null;
  new_status: string;
  action_user: string;
  action_source: string;
  notes: string;
  timestamp: string;
}

export interface CompraInfo {
  proveedor: string;
  numero_pedido?: string;
  nombre_proveedor?: string;
  observaciones?: string;
  fecha?: string;
}

export interface Notificacion {
  canal: string;
  mensaje: string;
  chat_id?: number;
  timestamp: string;
  status: string;
}

export interface Pedido {
  id: number;
  folio: string;
  cliente: string;
  tipo_venta: string;
  vendedor: string;
  documentos: string[];
  estado: string;
  checklist?: ChecklistItem[];
}

export interface Talon {
  id: number;
  folio: string;
  cliente: string;
  rfc: string;
  seccion: string;
  vendedor: string;
  descuento_actual: number;
  descuento_nuevo: number;
  venta_posible: number;
  estado: string;
  mensaje_generado?: boolean;
  revision_excel?: boolean;
  autorizacion_excel?: boolean;
  sindicato_excel?: boolean;
}

export interface TalonDetail extends Talon {
  revision: Record<string, unknown>;
  mensaje_vendedor?: string | null;
  resumen_refinanciamiento?: {
    total_abono_nuevo: number;
    simulacion: Record<number, Record<string, number>>;
  } | null;
  archivos?: Record<string, string>;
}

export interface RevisionCreatePayload {
  cliente: string;
  rfc: string;
  seccion?: string;
  vendedor: string;
  qna?: string;
  descuentos_talon: number;
  abono_extra?: number;
  programado?: number;
  tiene_programado?: string;
  codigos?: Record<string, number>;
  facturas?: Array<{
    FACT: string;
    VTA: number;
    SALDO: number;
    ABONO: number;
    INCLUIR?: boolean;
  }>;
}

export interface AutorizacionPayload {
  telefono?: string;
  fecha: string;
  folio?: string;
  semana: number;
  inicio: string;
  plazo?: number;
  monto_total?: number;
  observaciones?: string;
  productos?: Array<{
    producto: string;
    trans_credito?: number;
    credito?: number;
    precio_venta?: number;
    descuento?: number;
    tipo_vta?: string;
  }>;
}

export interface Refinanciamiento {
  id: number;
  cliente: string;
  venta_original: string;
  saldo: number;
  pagado: number;
  porcentaje_pagado: number;
  elegible: boolean;
  estado: string;
}

export interface Saldo {
  id: number;
  factura: string;
  cliente: string;
  saldo_sistema: number;
  saldo_calculado: number;
  diferencia: number;
  estado: string;
}

export interface AIQueryResponse {
  answer: string;
  sources: string[];
}