import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatEstado(estado: string): string {
  return estado
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDocumento(tipo: string): string {
  const labels: Record<string, string> = {
    orden_compra: "Orden de compra",
    identificacion: "Identificación",
    comprobante_domicilio: "Comprobante domicilio",
    referencias: "Referencias",
    talon: "Talón",
    estado_cuenta: "Estado de cuenta",
  };
  return labels[tipo] ?? formatEstado(tipo);
}