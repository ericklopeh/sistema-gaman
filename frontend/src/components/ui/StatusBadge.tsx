import { cn, formatEstado } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700 ring-amber-600/20",
  en_revision: "bg-blue-50 text-blue-700 ring-blue-600/20",
  autorizado: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  en_compulsa: "bg-violet-50 text-violet-700 ring-violet-600/20",
  pendiente_documentos: "bg-orange-50 text-orange-700 ring-orange-600/20",
  entregado: "bg-slate-50 text-slate-600 ring-slate-500/20",
  cancelado: "bg-red-50 text-red-700 ring-red-600/20",
  diferencia_detectada: "bg-red-50 text-red-700 ring-red-600/20",
  conciliado: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  aprobado: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  no_elegible: "bg-slate-100 text-slate-500 ring-slate-400/20",
  CAPTURADO: "bg-slate-100 text-slate-600 ring-slate-400/20",
  PENDIENTE_REVISION: "bg-amber-50 text-amber-700 ring-amber-600/20",
  EN_REVISION: "bg-blue-50 text-blue-700 ring-blue-600/20",
  CORRECCION_SOLICITADA: "bg-orange-50 text-orange-700 ring-orange-600/20",
  APROBADO: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  RECHAZADO: "bg-red-50 text-red-700 ring-red-600/20",
  AUTORIZACION_GENERADA: "bg-teal-50 text-teal-700 ring-teal-600/20",
  SINDICATO_GENERADO: "bg-teal-50 text-teal-700 ring-teal-600/20",
  ENVIADO_A_COMPULSA: "bg-violet-50 text-violet-700 ring-violet-600/20",
  COMPULSADO: "bg-violet-50 text-violet-700 ring-violet-600/20",
  EN_COMPRAS: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  COMPRADO: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  NOTIFICADO_VENDEDOR: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  FINALIZADO: "bg-slate-50 text-slate-600 ring-slate-500/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-slate-50 text-slate-600 ring-slate-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        style,
        className,
      )}
    >
      {formatEstado(status)}
    </span>
  );
}