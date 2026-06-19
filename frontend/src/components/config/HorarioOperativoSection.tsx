"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getHorarioOperativo, updateHorarioOperativo } from "@/lib/api";
import type { HorarioOperativo } from "@/lib/business-hours";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function HorarioOperativoSection() {
  const { user } = useAuth();
  const [horario, setHorario] = useState<HorarioOperativo | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getHorarioOperativo().then(setHorario).catch(() => {});
  }, []);

  if (!horario) return null;

  const isAdmin = user?.role === "ADMIN";

  async function handleSave() {
    if (!horario || !isAdmin) return;
    try {
      const updated = await updateHorarioOperativo({
        enabled: horario.enabled,
        start: horario.start,
        end: horario.end,
      });
      setHorario(updated);
      setMsg("Horario actualizado");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Horario operativo</h2>
        </div>
        <StatusBadge status={horario.within_hours ? "APROBADO" : "pendiente"} />
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Horario</dt>
          <dd>{horario.days_label} · {horario.start} – {horario.end}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Zona horaria</dt>
          <dd className="font-mono text-xs">{horario.timezone}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Restricción</dt>
          <dd>VENDEDOR (exentos: {horario.exempt_roles.join(", ")})</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Captura vendedor ahora</dt>
          <dd>{horario.captura_disponible_vendedor ? "Sí" : "No"}</dd>
        </div>
      </dl>
      {isAdmin && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={horario.enabled}
              onChange={(e) => setHorario({ ...horario, enabled: e.target.checked })}
            />
            Horario habilitado
          </label>
          <div className="flex gap-2">
            <input
              className="rounded border px-2 py-1 text-sm"
              value={horario.start}
              onChange={(e) => setHorario({ ...horario, start: e.target.value })}
            />
            <span className="self-center text-muted">a</span>
            <input
              className="rounded border px-2 py-1 text-sm"
              value={horario.end}
              onChange={(e) => setHorario({ ...horario, end: e.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white"
          >
            Guardar horario (ADMIN)
          </button>
        </div>
      )}
      {!isAdmin && horario.editable_from_gaman && (
        <p className="mt-3 text-xs text-muted">
          La edición del horario estará disponible para ADMIN desde esta pantalla.
        </p>
      )}
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
    </section>
  );
}