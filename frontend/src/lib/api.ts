import {
  getMockAIResponse,
  MOCK_DASHBOARD_SUMMARY,
  MOCK_PEDIDOS,
  MOCK_REFINANCIAMIENTOS,
  MOCK_SALDOS,
  MOCK_TALONES,
} from "./mock-data";
import type {
  AIQueryResponse,
  AutorizacionPayload,
  CasoPedido,
  DashboardSummary,
  DocumentoItem,
  Pedido,
  Refinanciamiento,
  ReportesSummary,
  RevisionCreatePayload,
  Saldo,
  Talon,
  TalonDetail,
} from "./types";

import { AUTH_ENABLED, DEFAULT_USER, getSession } from "./auth";
import type { HorarioOperativo } from "./business-hours";
import {
  normalizeCaso,
  normalizeCasosList,
  normalizePedidosList,
  safeDashboardSummary,
} from "./safe-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://192.168.68.123:8010";

function roleHeaders(role?: string): Record<string, string> {
  const r =
    role ??
    (typeof window !== "undefined"
      ? getSession()?.user.role ?? (!AUTH_ENABLED ? DEFAULT_USER.role : undefined)
      : !AUTH_ENABLED
        ? DEFAULT_USER.role
        : undefined);
  return r ? { "X-Gaman-Role": r } : {};
}

async function throwApiError(res: Response, path: string): Promise<never> {
  const text = await res.text();
  throw new Error(`API error ${res.status} ${path}: ${text}`);
}

export interface ApiResult<T> {
  data: T;
  fromMock: boolean;
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

async function fetchWithFallback<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
  transform?: (raw: unknown) => T,
): Promise<ApiResult<T>> {
  try {
    const raw = await fetchApi<unknown>(path, init);
    const data = transform ? transform(raw) : (raw as T);
    return { data, fromMock: false };
  } catch {
    return { data: fallback, fromMock: true };
  }
}

export async function loginDemo(email: string, password: string): Promise<{
  token: string;
  user: { email: string; role: string; name: string; vendedor?: string; telegram_id?: number };
  demo_mode: boolean;
}> {
  return fetchApi("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getDemoStatus(): Promise<Record<string, unknown>> {
  return fetchApi("/api/demo/status");
}

export async function seedDemo(force = false): Promise<Record<string, unknown>> {
  return fetchApi(`/api/demo/seed?force=${force}`);
}

export function getDashboardSummary(): Promise<ApiResult<DashboardSummary>> {
  return fetchWithFallback(
    "/api/dashboard/summary",
    MOCK_DASHBOARD_SUMMARY,
    undefined,
    (raw) => safeDashboardSummary(raw as Partial<DashboardSummary>),
  );
}

export function getCasos(): Promise<ApiResult<CasoPedido[]>> {
  return fetchWithFallback("/api/casos", [], undefined, normalizeCasosList);
}

export async function getCasoByFolio(folio: string): Promise<CasoPedido> {
  try {
    const raw = await fetchApi<Record<string, unknown>>(`/api/casos/${encodeURIComponent(folio)}`);
    return normalizeCaso(raw);
  } catch {
    throw new Error(`No se pudo cargar el expediente ${folio}`);
  }
}

export function getDocumentos(): Promise<ApiResult<DocumentoItem[]>> {
  return fetchWithFallback("/api/documentos", []);
}

export function getReportesSummary(): Promise<ApiResult<ReportesSummary>> {
  return fetchWithFallback("/api/reportes/summary", {
    pedidos_por_estado: {},
    ventas_por_vendedor: {},
    pendientes_compulsa: 0,
    pendientes_compras: 0,
    comprados_hoy: 0,
    saldos_con_diferencia: 0,
    refinanciamientos_elegibles: 0,
    documentos_incompletos: 0,
    total_pedidos: 0,
  });
}

export async function getHorarioOperativo(): Promise<HorarioOperativo> {
  return fetchApi<HorarioOperativo>("/api/config/horario-operativo");
}

export async function updateHorarioOperativo(
  data: Partial<Pick<HorarioOperativo, "enabled" | "timezone" | "start" | "end" | "days">>,
): Promise<HorarioOperativo> {
  return fetchApi<HorarioOperativo>("/api/config/horario-operativo", {
    method: "PATCH",
    headers: roleHeaders("ADMIN"),
    body: JSON.stringify(data),
  });
}

export async function crearPedidoTelegram(data: FormData): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/api/pedidos/from-telegram`, { method: "POST", body: data });
  if (!res.ok) await throwApiError(res, "/api/pedidos/from-telegram");
  return res.json();
}

export async function subirDocumentoTelegram(
  folio: string,
  documentType: string,
  file: Blob,
): Promise<Record<string, unknown>> {
  const fd = new FormData();
  fd.append("document_type", documentType);
  fd.append("archivo", file, `${documentType}.jpg`);
  fd.append("usuario", "telegram");
  const res = await fetch(`${API_URL}/api/pedidos/${folio}/documentos`, {
    method: "POST",
    body: fd,
    headers: roleHeaders("VENDEDOR"),
  });
  if (!res.ok) await throwApiError(res, `/api/pedidos/${folio}/documentos`);
  return res.json();
}

export function getTalones(): Promise<ApiResult<Talon[]>> {
  return fetchWithFallback("/api/talones", MOCK_TALONES);
}

export async function crearRevision(
  payload: RevisionCreatePayload,
  role?: string,
): Promise<TalonDetail> {
  return fetchApi<TalonDetail>("/api/talones/revisiones", {
    method: "POST",
    headers: roleHeaders(role),
    body: JSON.stringify(payload),
  });
}

export async function getTalonDetail(id: number): Promise<TalonDetail> {
  return fetchApi<TalonDetail>(`/api/talones/${id}`);
}

export async function generarAutorizacion(
  id: number,
  payload: AutorizacionPayload,
): Promise<unknown> {
  return fetchApi(`/api/talones/${id}/generar-autorizacion`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function downloadTalonArchivo(
  id: number,
  tipo: "revision" | "autorizacion" | "sindicato",
): Promise<void> {
  const res = await fetch(`${API_URL}/api/talones/${id}/download/${tipo}`);
  if (!res.ok) {
    throw new Error(`Error al descargar ${tipo}`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `${tipo}_${id}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getPedidos(): Promise<ApiResult<Pedido[]>> {
  return fetchWithFallback("/api/pedidos", MOCK_PEDIDOS, undefined, normalizePedidosList);
}

export async function capturarPedido(form: FormData, role?: string): Promise<CasoPedido> {
  const res = await fetch(`${API_URL}/api/pedidos/captura`, {
    method: "POST",
    body: form,
    headers: roleHeaders(role),
  });
  if (!res.ok) await throwApiError(res, "/api/pedidos/captura");
  return res.json() as Promise<CasoPedido>;
}

export async function getCaso(id: number): Promise<CasoPedido> {
  try {
    const raw = await fetchApi<Record<string, unknown>>(`/api/cases/${id}`);
    return normalizeCaso(raw);
  } catch {
    try {
      const raw = await fetchApi<Record<string, unknown>>(`/api/casos/PED-${String(id).padStart(6, "0")}`);
      return normalizeCaso(raw);
    } catch {
      throw new Error(`No se pudo cargar el caso ${id}`);
    }
  }
}

export function getSistemasPendientes(): Promise<ApiResult<CasoPedido[]>> {
  return fetchWithFallback("/api/sistemas/pendientes", [], undefined, normalizeCasosList);
}

export function getCompulsaPendientes(): Promise<ApiResult<CasoPedido[]>> {
  return fetchWithFallback("/api/compulsa/pendientes", []);
}

export function getComprasPendientes(): Promise<ApiResult<CasoPedido[]>> {
  return fetchWithFallback("/api/compras/pendientes", []);
}

export async function sistemasRevisar(id: number): Promise<CasoPedido> {
  return fetchApi(`/api/sistemas/${id}/revisar`, {
    method: "POST",
    body: JSON.stringify({ usuario: "Sistemas" }),
  });
}

export async function sistemasAprobar(id: number, auth: AutorizacionPayload): Promise<CasoPedido> {
  return fetchApi(`/api/sistemas/${id}/aprobar`, {
    method: "POST",
    body: JSON.stringify(auth),
  });
}

export async function sistemasCorregir(id: number, motivo: string): Promise<CasoPedido> {
  return fetchApi(`/api/sistemas/${id}/corregir`, {
    method: "POST",
    body: JSON.stringify({ motivo, usuario: "Sistemas" }),
  });
}

export async function sistemasRechazar(id: number, motivo: string): Promise<CasoPedido> {
  return fetchApi(`/api/sistemas/${id}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ motivo, usuario: "Sistemas" }),
  });
}

export async function compulsaMarcar(id: number, observaciones: string): Promise<CasoPedido> {
  return fetchApi(`/api/compulsa/${id}/compulsar`, {
    method: "POST",
    body: JSON.stringify({ observaciones, usuario: "Recepción" }),
  });
}

export async function comprasRegistrar(
  id: number,
  data: { proveedor: string; numero_pedido?: string; nombre_proveedor?: string; observaciones?: string },
): Promise<CasoPedido> {
  return fetchApi(`/api/compras/${id}/comprar`, {
    method: "POST",
    body: JSON.stringify({ ...data, usuario: "Compras" }),
  });
}

export async function downloadCasoArchivo(caseId: number, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/cases/${caseId}/download/${filename}`);
  if (!res.ok) throw new Error(`Error al descargar ${filename}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getRefinanciamientos(): Promise<ApiResult<Refinanciamiento[]>> {
  return fetchWithFallback("/api/refinanciamientos", MOCK_REFINANCIAMIENTOS);
}

export function getSaldos(): Promise<ApiResult<Saldo[]>> {
  return fetchWithFallback("/api/saldos", MOCK_SALDOS);
}

export async function queryAI(question: string): Promise<ApiResult<AIQueryResponse>> {
  try {
    const data = await fetchApi<AIQueryResponse>("/api/ai/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    return { data, fromMock: false };
  } catch {
    return { data: getMockAIResponse(question), fromMock: true };
  }
}