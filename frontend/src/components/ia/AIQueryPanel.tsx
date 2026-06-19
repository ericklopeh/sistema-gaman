"use client";

import { useState } from "react";
import { Brain, Loader2, Send, Sparkles } from "lucide-react";
import { queryAI } from "@/lib/api";
import type { AIQueryResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { MockDataBanner } from "@/components/ui/MockDataBanner";

const EXAMPLE_QUESTIONS = [
  "¿Qué pedidos están pendientes de compulsa?",
  "¿Qué clientes tienen diferencias de saldo?",
  "¿Qué documentos faltan para autorizar este pedido?",
  "Resume el caso de Juan Pérez.",
];

export function AIQueryPanel() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromMock, setFromMock] = useState(false);
  const [response, setResponse] = useState<AIQueryResponse | null>(null);

  const handleSubmit = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text) return;

    setQuestion(text);
    setLoading(true);

    const result = await queryAI(text);
    setFromMock(result.fromMock);
    setResponse(result.data);
    setLoading(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {fromMock && <MockDataBanner />}

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <label htmlFor="ai-question" className="mb-2 block text-sm font-medium text-slate-900">
            Pregunta
          </label>
          <textarea
            id="ai-question"
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Escribe tu consulta sobre pedidos, talones, saldos o casos..."
            className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={loading || !question.trim()}
              onClick={() => handleSubmit()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Consultar
            </Button>
          </div>
        </div>

        {response && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-slate-900">Respuesta</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{response.answer}</p>

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Fuentes consultadas
              </p>
              <div className="flex flex-wrap gap-2">
                {response.sources.map((source) => (
                  <span
                    key={source}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-900">Ejemplos de preguntas</h2>
          </div>
          <div className="space-y-2">
            {EXAMPLE_QUESTIONS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleSubmit(example)}
                className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2.5 text-left text-xs text-slate-600 transition-colors hover:border-accent/30 hover:bg-blue-50 hover:text-slate-900"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-slate-50/50 p-5">
          <p className="text-xs leading-relaxed text-muted">
            Módulo conceptual de IA/RAG. Las respuestas se generan a partir de los datos
            operativos del sistema en modo demo.
          </p>
        </div>
      </aside>
    </div>
  );
}