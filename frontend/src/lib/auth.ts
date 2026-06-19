export type UserRole = "ADMIN" | "SISTEMAS" | "RECEPCION" | "COMPRAS" | "VENDEDOR";

export interface DemoUser {
  email: string;
  role: UserRole;
  name: string;
  vendedor?: string | null;
  telegram_id?: number;
}

const STORAGE_KEY = "gaman_demo_user";
const TOKEN_KEY = "gaman_demo_token";

/** Desactivado por ahora — activar con NEXT_PUBLIC_AUTH_ENABLED=true */
export const AUTH_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AUTH_ENABLED === "1";

export const DEFAULT_USER: DemoUser = {
  email: "admin@gaman.local",
  role: "ADMIN",
  name: "Administrador GAMAN",
};

export function saveSession(token: string, user: DemoUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

export function getSession(): { token: string; user: DemoUser } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) as DemoUser };
  } catch {
    return null;
  }
}

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  ADMIN: ["*"],
  SISTEMAS: ["/", "/pedidos", "/sistemas", "/documentos", "/reportes", "/ia", "/configuracion", "/expediente", "/telegram-demo"],
  RECEPCION: ["/", "/compulsa", "/documentos", "/reportes", "/configuracion", "/expediente"],
  COMPRAS: ["/", "/compras", "/documentos", "/reportes", "/configuracion", "/expediente"],
  VENDEDOR: ["/", "/pedidos", "/documentos", "/ia", "/telegram-demo", "/configuracion", "/expediente"],
};

export function canAccess(role: UserRole, path: string): boolean {
  const allowed = ROLE_ROUTES[role];
  if (allowed.includes("*")) return true;
  if (path === "/login") return true;
  return allowed.some((r) => (r === "/" ? path === "/" : path.startsWith(r)));
}

export const NAV_BY_ROLE: Record<UserRole, string[]> = {
  ADMIN: ["/", "/pedidos", "/sistemas", "/compulsa", "/compras", "/talones", "/refinanciamientos", "/saldos", "/documentos", "/reportes", "/ia", "/telegram-demo", "/configuracion"],
  SISTEMAS: ["/", "/pedidos", "/sistemas", "/documentos", "/reportes", "/ia", "/configuracion"],
  RECEPCION: ["/", "/compulsa", "/documentos", "/reportes", "/configuracion"],
  COMPRAS: ["/", "/compras", "/documentos", "/reportes", "/configuracion"],
  VENDEDOR: ["/", "/pedidos", "/documentos", "/ia", "/telegram-demo", "/configuracion"],
};

export const DEMO_CREDENTIALS = [
  { email: "admin@gaman.local", password: "demo123", role: "ADMIN" as const },
  { email: "sistemas@gaman.local", password: "demo123", role: "SISTEMAS" as const },
  { email: "recepcion@gaman.local", password: "demo123", role: "RECEPCION" as const },
  { email: "compras@gaman.local", password: "demo123", role: "COMPRAS" as const },
  { email: "vendedor@gaman.local", password: "demo123", role: "VENDEDOR" as const },
];