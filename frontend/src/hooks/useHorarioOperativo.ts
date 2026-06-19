"use client";

import { useEffect, useState } from "react";
import { getHorarioOperativo } from "@/lib/api";
import type { HorarioOperativo } from "@/lib/business-hours";

export function useHorarioOperativo() {
  const [horario, setHorario] = useState<HorarioOperativo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHorarioOperativo()
      .then(setHorario)
      .catch(() => setHorario(null))
      .finally(() => setLoading(false));
  }, []);

  return { horario, loading };
}