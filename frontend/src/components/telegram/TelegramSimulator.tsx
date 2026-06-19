"use client";

import { useCallback, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { crearPedidoTelegram, getHorarioOperativo, subirDocumentoTelegram } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { OUT_OF_HOURS_MESSAGE, parseApiErrorMessage } from "@/lib/business-hours";

type ChatMessage = { from: "bot" | "user"; text: string };

const CHECKLIST_MUEBLE = ["orden_descuento", "pedido"] as const;
const CHECKLIST_DINERO = ["pedido", "orden_descuento", "caratula_banco"] as const;

const DOC_LABELS: Record<string, string> = {
  orden_descuento: "Orden de descuento",
  pedido: "Pedido",
  caratula_banco: "Carátula banco",
};

type FlowStep = "idle" | "cliente" | "tipo" | "fotos" | "done";

function fakeImageBlob(label: string): Blob {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e8f0fe";
  ctx.fillRect(0, 0, 400, 200);
  ctx.fillStyle = "#1e3a5f";
  ctx.font = "16px sans-serif";
  ctx.fillText(label, 20, 100);
  return new Blob([], { type: "image/jpeg" });
}

async function fakeJpegBlob(label: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e8f0fe";
  ctx.fillRect(0, 0, 400, 200);
  ctx.fillStyle = "#1e3a5f";
  ctx.font = "16px sans-serif";
  ctx.fillText(label, 20, 100);
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b ?? fakeImageBlob(label)), "image/jpeg", 0.9);
  });
}

export function TelegramSimulator() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Hola, soy el simulador Telegram GAMAN.\nComandos: /start /nuevo_pedido /mis_pedidos /mis_pendientes /mis_ventas_hoy /estatus" },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<FlowStep>("idle");
  const flowRef = useRef({
    cliente: "",
    orderType: "mueble" as "mueble" | "dinero",
    folio: "",
    docQueue: [] as string[],
    docIndex: 0,
    telegramId: user?.telegram_id ?? 100001,
    vendedor: user?.vendedor ?? user?.name ?? "Vendedor Demo",
  });
  const chatEnd = useRef<HTMLDivElement>(null);

  const addBot = useCallback((text: string) => {
    setMessages((m) => [...m, { from: "bot", text }]);
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const addUser = useCallback((text: string) => {
    setMessages((m) => [...m, { from: "user", text }]);
  }, []);

  async function handleCommand(cmd: string) {
    const telegramId = flowRef.current.telegramId;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

    if (cmd === "/start") {
      addBot(`Hola ${flowRef.current.vendedor}.\n/nuevo_pedido — capturar pedido\n/mis_pedidos — tus pedidos\n/mis_pendientes — pendientes\n/mis_ventas_hoy — ventas hoy\n/estatus — resumen`);
      return;
    }

    if (cmd === "/nuevo_pedido") {
      try {
        const h = await getHorarioOperativo();
        if (h.enabled && !h.captura_disponible_vendedor) {
          addBot(OUT_OF_HOURS_MESSAGE);
          return;
        }
      } catch {
        /* backend validará */
      }
      setStep("cliente");
      flowRef.current = { ...flowRef.current, cliente: "", folio: "", docIndex: 0 };
      addBot("Escribe el nombre del cliente:");
      return;
    }

    if (cmd === "/mis_pedidos") {
      try {
        const res = await fetch(`${base}/api/vendedores/${telegramId}/pedidos`);
        const data = await res.json();
        if (!data.length) addBot("No tienes pedidos.");
        else addBot(data.slice(0, 8).map((p: { folio: string; cliente: string; estado: string }) =>
          `• ${p.folio} — ${p.cliente} (${p.estado})`).join("\n"));
      } catch {
        addBot("Error consultando pedidos.");
      }
      return;
    }

    if (cmd === "/mis_pendientes") {
      try {
        const res = await fetch(`${base}/api/vendedores/${telegramId}/pendientes`);
        const data = await res.json();
        if (!data.length) addBot("Sin pendientes activos.");
        else addBot(data.map((p: { folio: string; estado: string }) => `• ${p.folio} — ${p.estado}`).join("\n"));
      } catch {
        addBot("Error consultando pendientes.");
      }
      return;
    }

    if (cmd === "/mis_ventas_hoy") {
      try {
        const res = await fetch(`${base}/api/vendedores/${telegramId}/ventas-hoy`);
        const data = await res.json();
        addBot(`Ventas hoy: ${data.total}\n${(data.ventas ?? []).map((v: { folio: string; cliente: string }) => `• ${v.folio} ${v.cliente}`).join("\n") || "Sin ventas hoy"}`);
      } catch {
        addBot("Error consultando ventas.");
      }
      return;
    }

    if (cmd === "/estatus") {
      try {
        const res = await fetch(`${base}/api/vendedores/${telegramId}/estatus`);
        const data = await res.json();
        const lines = Object.entries(data.por_estado ?? {}).map(([e, n]) => `• ${e}: ${n}`);
        addBot(`Total: ${data.total_pedidos}\n${lines.join("\n")}`);
      } catch {
        addBot("Error consultando estatus.");
      }
      return;
    }

    addBot("Comando no reconocido. Usa /start");
  }

  async function handleFlowInput(text: string) {
    const f = flowRef.current;

    if (step === "cliente") {
      f.cliente = text;
      setStep("tipo");
      addBot(`Cliente: ${text}\n¿Tipo de venta? (Mueble / Dinero)`);
      return;
    }

    if (step === "tipo") {
      const t = text.toLowerCase();
      if (t !== "mueble" && t !== "dinero") {
        addBot("Escribe Mueble o Dinero:");
        return;
      }
      f.orderType = t as "mueble" | "dinero";
      f.docQueue = [...(t === "dinero" ? CHECKLIST_DINERO : CHECKLIST_MUEBLE)];
      f.docIndex = 0;

      const fd = new FormData();
      fd.append("cliente", f.cliente);
      fd.append("order_type", f.orderType);
      fd.append("vendedor", f.vendedor);
      fd.append("seller_telegram_chat_id", String(f.telegramId));
      try {
        const created = await crearPedidoTelegram(fd);
        f.folio = String(created.folio);
        setStep("fotos");
        addBot(`Folio: ${f.folio}\nEnvía foto: ${DOC_LABELS[f.docQueue[0]]}\n(escribe "foto" para usar documento demo)`);
      } catch (e) {
        addBot(parseApiErrorMessage(e));
        setStep("idle");
      }
      return;
    }

    if (step === "fotos") {
      if (text.toLowerCase() !== "foto" && !text.startsWith("/")) {
        addBot('Escribe "foto" para simular envío de imagen demo.');
        return;
      }
      const docType = f.docQueue[f.docIndex];
      try {
        const blob = await fakeJpegBlob(`${DOC_LABELS[docType]} DEMO`);
        const result = await subirDocumentoTelegram(f.folio, docType, blob);
        f.docIndex += 1;
        const checklistOk = (result.checklist as Array<{ completo: boolean }> ?? []).every((c) => c.completo);
        if (checklistOk || f.docIndex >= f.docQueue.length) {
          setStep("done");
          addBot(`✅ Pedido registrado\nFolio: ${result.folio}\nEstado: ${result.estado}\nVisible en /sistemas`);
          setStep("idle");
        } else {
          addBot(`✓ ${DOC_LABELS[docType]} recibido.\nSiguiente: ${DOC_LABELS[f.docQueue[f.docIndex]]}\n(escribe "foto")`);
        }
      } catch {
        addBot("Error subiendo documento.");
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    addUser(text);
    setInput("");

    if (text.startsWith("/")) {
      await handleCommand(text.split(" ")[0].toLowerCase());
      return;
    }

    if (step !== "idle") {
      await handleFlowInput(text);
      return;
    }

    addBot('Usa un comando: /start, /nuevo_pedido, /mis_pedidos…');
  }

  return (
    <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="bg-[#2AABEE] px-4 py-3 text-white">
        <p className="font-semibold">GAMAN Bot (Simulador)</p>
        <p className="text-xs opacity-90">{flowRef.current.vendedor} · ID {flowRef.current.telegramId}</p>
      </div>
      <div className="h-96 space-y-3 overflow-y-auto bg-[#e5ddd5] p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.from === "user" ? "bg-[#dcf8c6] text-slate-900" : "bg-white text-slate-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEnd} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t bg-white p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mensaje o comando…"
          className="flex-1 rounded-full border px-4 py-2 text-sm"
        />
        <Button type="submit" variant="primary" size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="border-t bg-slate-50 px-3 py-2 text-xs text-muted">
        Demo: escribe &quot;foto&quot; para simular imágenes. Sin token Telegram real.
      </p>
    </div>
  );
}