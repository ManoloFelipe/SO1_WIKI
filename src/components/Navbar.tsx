"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Layers,
  Cpu,
  Home,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  BookOpen,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface StatusData {
  connected: boolean;
  databaseName?: string;
  latencyMs?: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function checkDb() {
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        if (!ignore) {
          setStatus(data);
        }
      } catch {
        if (!ignore) {
          setStatus({ connected: false });
        }
      } finally {
        if (!ignore) {
          setLoadingStatus(false);
        }
      }
    }

    checkDb();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Marca */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Wiki App
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-0.5">
                Sistemas Operativos 1
              </span>
            </div>
          </Link>

          {/* Enlaces de Navegación */}
          <nav className="hidden sm:flex items-center space-x-1">
            <Link
              href="/"
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === "/"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Inicio
            </Link>
            <Link
              href="/wiki"
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith("/wiki")
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Wiki
            </Link>
            <Link
              href="/concurrency"
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === "/concurrency"
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Motor Concurrente
              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
                Lab II
              </span>
            </Link>
            <Link
              href="/memory-simulator"
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === "/memory-simulator"
                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-cyan-500" />
              Simulador RAM
              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
                RAM
              </span>
            </Link>
          </nav>
        </div>

        {/* Controles del lado derecho */}
        <div className="flex items-center space-x-3">
          {/* Badge de conexión a MongoDB Atlas */}
          {!loadingStatus && (
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                status?.connected
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
              }`}
              title={
                status?.connected
                  ? `MongoDB Atlas Conectado (${status.latencyMs ?? "?"}ms)`
                  : "MongoDB Atlas Desconectado"
              }
            >
              {status?.connected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Atlas ({status.latencyMs}ms)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span>Atlas Desconectado</span>
                </>
              )}
            </div>
          )}

          {/* Enlace móvil a motor concurrente */}
          <Link
            href="/concurrency"
            className="sm:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400"
            title="Motor Concurrente"
          >
            <GitBranch className="w-4 h-4" />
          </Link>

          {/* Enlace móvil a simulador */}
          <Link
            href="/memory-simulator"
            className="sm:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400"
            title="Simulador de Memoria RAM"
          >
            <Cpu className="w-4 h-4" />
          </Link>

          {/* Alternador de Modo Claro / Oscuro */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
