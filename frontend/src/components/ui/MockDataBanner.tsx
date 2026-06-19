import { Database } from "lucide-react";

export function MockDataBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <Database className="h-4 w-4 shrink-0" />
      <span>
        Mostrando datos de demostración. El backend no está disponible en este momento.
      </span>
    </div>
  );
}