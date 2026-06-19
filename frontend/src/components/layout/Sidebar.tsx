"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Brain,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  RefreshCw,
  Scale,
  Settings,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AUTH_ENABLED, NAV_BY_ROLE } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ALL_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pedidos", label: "Pedidos", icon: Package },
  { href: "/sistemas", label: "Sistemas", icon: Shield },
  { href: "/compulsa", label: "Compulsa", icon: ClipboardCheck },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/talones", label: "Talones", icon: FileSpreadsheet },
  { href: "/refinanciamientos", label: "Refinanciamientos", icon: RefreshCw },
  { href: "/saldos", label: "Saldos", icon: Scale },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/ia", label: "IA / RAG", icon: Brain },
  { href: "/telegram-demo", label: "Telegram", icon: MessageCircle },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role ?? "ADMIN";
  const allowed = new Set(NAV_BY_ROLE[role]);

  const items = ALL_NAV.filter((item) => allowed.has(item.href));

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            G
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sistema GAMAN</p>
            <p className="text-xs text-slate-400">Demo operativa</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-white"
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-200",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        {user && (
          <div className="mb-3">
            <p className="truncate text-xs font-medium text-slate-300">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
        )}
        {AUTH_ENABLED && (
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-sidebar-hover hover:text-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        )}
        <p className="mt-2 text-xs text-slate-600">v0.3.0 · DEMO_MODE</p>
      </div>
    </aside>
  );
}