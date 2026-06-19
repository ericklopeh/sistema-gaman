import { Clock } from "lucide-react";
import { OUT_OF_HOURS_MESSAGE } from "@/lib/business-hours";

export function OutOfHoursBanner() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <Clock className="h-4 w-4" />
        Fuera de horario operativo
      </div>
      <pre className="whitespace-pre-wrap font-sans leading-relaxed">{OUT_OF_HOURS_MESSAGE}</pre>
    </div>
  );
}