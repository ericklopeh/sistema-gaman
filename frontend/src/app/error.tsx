"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GAMAN page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-900">Algo salió mal</h2>
      <p className="mt-2 text-sm text-red-700">
        No pudimos cargar esta pantalla. El resto del sistema sigue disponible.
      </p>
      <Button variant="primary" className="mt-6" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  );
}