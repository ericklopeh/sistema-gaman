"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_CREDENTIALS, saveSession, type DemoUser } from "@/lib/auth";
import { loginDemo } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("sistemas@gaman.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginDemo(email, password);
      const user = res.user as DemoUser;
      saveSession(res.token, user);
      setUser(user);
      router.replace("/");
    } catch {
      setError("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo123");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-xl font-bold text-white">
            G
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Sistema GAMAN</h1>
          <p className="mt-1 text-sm text-slate-500">Acceso demo para presentación</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">Acceso rápido demo</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => quickLogin(c.email)}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
              >
                {c.role}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Contraseña: demo123</p>
        </div>
      </div>
    </div>
  );
}