"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { seedDemo } from "@/lib/api";

export function ConfigActions() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSeed(force: boolean) {
    setLoading(true);
    setMsg("");
    try {
      const res = await seedDemo(force);
      setMsg(force ? `Reiniciado: ${res.casos_creados} casos` : String(res.message ?? res.status));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
      <button
        type="button"
        disabled={loading}
        onClick={() => handleSeed(false)}
        className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
      >
        Semilla si vacío
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => handleSeed(true)}
        className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
      >
        <RefreshCw className="h-3 w-3" />
        Reiniciar demo
      </button>
      {msg && <p className="w-full text-xs text-muted">{msg}</p>}
    </div>
  );
}