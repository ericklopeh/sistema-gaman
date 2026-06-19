"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { TalonDetail } from "@/lib/types";
import { crearRevision } from "@/lib/api";

interface NuevaRevisionFormProps {
  onCreated: (talon: TalonDetail) => void;
  onCancel: () => void;
}

const CODIGOS_DEFAULT: Record<string, number> = {
  E4: 8500,
  E3: 4200,
  Q: 1800,
  CP: 950,
  "7": 1200,
  CT: 600,
  "7B": 0,
  E9: 1500,
  SG: 400,
  O1: 0,
  DC: 350,
};

export function NuevaRevisionForm({ onCreated, onCancel }: NuevaRevisionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    cliente: "Muebles del Norte SA de CV",
    rfc: "MNO850312AB1",
    seccion: "21",
    vendedor: "Carlos Mendoza",
    qna: "09-2026",
    descuentos_talon: 12500,
    abono_extra: 0,
    programado: 0,
    tiene_programado: "No",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const talon = await crearRevision({
        ...form,
        codigos: CODIGOS_DEFAULT,
        facturas: [
          {
            FACT: "F-10234",
            VTA: 180000,
            SALDO: 75000,
            ABONO: 2500,
            INCLUIR: true,
          },
        ],
      });
      onCreated(talon);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear revisión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Nueva revisión de talón</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["cliente", "Cliente"],
            ["rfc", "RFC"],
            ["seccion", "Sección"],
            ["vendedor", "Vendedor"],
            ["qna", "QNA"],
            ["descuentos_talon", "Descuentos talón"],
            ["abono_extra", "Apoyo adicional"],
            ["programado", "Programado"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{label}</span>
            <input
              className="rounded-lg border border-border px-3 py-2"
              type={key === "descuentos_talon" || key === "abono_extra" || key === "programado" ? "number" : "text"}
              value={form[key]}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [key]:
                    key === "descuentos_talon" || key === "abono_extra" || key === "programado"
                      ? Number(e.target.value)
                      : e.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-2">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Calculando..." : "Generar revisión"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}