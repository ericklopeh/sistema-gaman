export const OUT_OF_HOURS_MESSAGE =
  "⛔ Sistema GAMAN fuera de horario operativo.\n\n" +
  "La captura de pedidos está disponible únicamente:\n\n" +
  "Lunes a Viernes\n" +
  "09:00 AM a 06:00 PM\n\n" +
  "Intente nuevamente dentro del horario establecido.";

export interface HorarioOperativo {
  enabled: boolean;
  timezone: string;
  start: string;
  end: string;
  days: number[];
  days_label: string;
  within_hours: boolean;
  captura_disponible_vendedor: boolean;
  exempt_roles: string[];
  restricted_roles: string[];
  editable_from_gaman?: boolean;
}

export function isVendedorRestricted(role: string | undefined): boolean {
  return role === "VENDEDOR";
}

export function canVendedorCapture(
  role: string | undefined,
  horario: HorarioOperativo | null,
): boolean {
  if (!isVendedorRestricted(role)) return true;
  if (!horario?.enabled) return true;
  return horario.captura_disponible_vendedor;
}

export function parseApiErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      const match = err.message.match(/\{[\s\S]*\}/);
      if (match) {
        const body = JSON.parse(match[0]) as { detail?: { message?: string } | string };
        if (typeof body.detail === "object" && body.detail?.message) {
          return body.detail.message;
        }
      }
    } catch {
      /* ignore */
    }
    return err.message;
  }
  return "Error desconocido";
}