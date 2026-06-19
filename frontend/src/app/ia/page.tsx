import { AIQueryPanel } from "@/components/ia/AIQueryPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export default function IAPage() {
  return (
    <div>
      <PageHeader
        title="IA / RAG"
        description="Consultas inteligentes sobre la operación comercial"
      />
      <AIQueryPanel />
    </div>
  );
}