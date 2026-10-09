"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Navbar from "@/components/Navbar";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  RefreshCw,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  GitBranch,
  Copy,
  Check,
  Zap,
  Info,
  Footprints,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ServerInfo {
  pid: number;
  platform: string;
  python_version: string;
  timestamp: string;
}

interface AccountsState {
  A: number;
  B: number;
  C: number;
  total: number;
  invariant_satisfied: boolean;
}

interface WorkerInfo {
  name: string;
  tid: number;
  role: string;
  status: string;
  holding: string[];
  waiting: string | null;
}

interface RagNode {
  id: string;
  type: "RESOURCE" | "THREAD";
  label: string;
}

interface RagEdge {
  from: string;
  to: string;
  type: "HOLDING" | "WAITING" | "RACE_CONFLICT";
  label: string;
}

interface RagState {
  nodes: RagNode[];
  edges: RagEdge[];
  cycle_detected: boolean;
  cycle_path: string[];
  cycle_edges: string[][];
}

interface KernelEvent {
  id: number;
  timestamp: string;
  tid: number;
  thread_name: string;
  event_type: string;
  resource: string | null;
  detail: string;
}

interface StepInfo {
  active: boolean;
  scenario: string | null;
  current_step: number;
  total_steps: number;
  title: string | null;
  os_concept: string | null;
  description: string | null;
  can_next: boolean;
  can_prev: boolean;
}

interface EngineSnapshot {
  server_info: ServerInfo;
  scenario: string;
  accounts: AccountsState;
  workers: WorkerInfo[];
  rag: RagState;
  events: KernelEvent[];
  step_info?: StepInfo;
}

export default function ConcurrencyPage() {
  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [eventFilter, setEventFilter] = useState<string>("ALL");
  const [stepMode, setStepMode] = useState<boolean>(false);
  const [selectedStepScenario, setSelectedStepScenario] = useState<string>("DEADLOCK");

  const toggleStepMode = () => {
    const next = !stepMode;
    setStepMode(next);
    if (next) {
      setAutoRefresh(false);
      sendAction("step/init", { scenario: selectedStepScenario });
    } else {
      sendAction("step/exit");
    }
  };

  const changeStepScenario = (sc: string) => {
    setSelectedStepScenario(sc);
    sendAction("step/init", { scenario: sc });
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/concurrency/status", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setSnapshot(data.data);
        setErrorMsg(null);
      } else {
        setErrorMsg(data.detail || data.error || "No se pudo conectar con el motor de Python.");
      }
    } catch {
      setErrorMsg("Error de red conectando con el proxy /api/concurrency. Verifica que el servidor Python esté activo en el puerto 8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function poll() {
      try {
        const res = await fetch("/api/concurrency/status", { cache: "no-store" });
        const data = await res.json();
        if (ignore) return;
        if (data.success && data.data) {
          setSnapshot(data.data);
          setErrorMsg(null);
        } else {
          setErrorMsg(data.detail || data.error || "No se pudo conectar con el motor de Python.");
        }
      } catch {
        if (!ignore) {
          setErrorMsg(
            "Error de red conectando con el proxy /api/concurrency. Verifica que el servidor Python esté activo en el puerto 8000."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    poll();

    if (!autoRefresh) {
      return () => {
        ignore = true;
      };
    }

    const interval = setInterval(poll, 800);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [autoRefresh]);

  const sendAction = (endpoint: string, body: Record<string, unknown> = {}) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/concurrency/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.data) {
          setSnapshot(data.data);
        }
        await fetchStatus();
      } catch (err) {
        console.error("Error al ejecutar acción:", err);
      }
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const pid = snapshot?.server_info?.pid ?? 0;

  const filteredEvents = (snapshot?.events || []).filter((evt) => {
    if (eventFilter === "ALL") return true;
    if (eventFilter === "DEADLOCK") return evt.event_type.includes("DEADLOCK") || evt.event_type.includes("CANCEL");
    if (eventFilter === "RACE") return evt.event_type.includes("RACE");
    if (eventFilter === "LOCKS") return evt.event_type === "ADQUISICIÓN" || evt.event_type === "LIBERACIÓN" || evt.event_type === "ESPERA";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cabecera del Motor */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Motor de Transacciones Concurrentes
                </h1>
                {snapshot ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Python OS Activo (PID {snapshot.server_info.pid})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistemas Operativos 1 • Hilos Nativos del SO (`threading.Thread`) • Locks por Cuenta • RAG & DFS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Modo Paso a Paso Pedagógico */}
            <button
              onClick={toggleStepMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                stepMode
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              Paso a Paso {stepMode ? "ON" : "OFF"}
            </button>

            {/* Controles de Modo Dinámico */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              disabled={stepMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                stepMode
                  ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                  : autoRefresh
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
              title={stepMode ? "Desactiva Paso a Paso para usar Auto-Refresco" : undefined}
            >
              <RefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${autoRefresh && !stepMode ? "animate-spin" : ""}`} />
              Auto-Refresco {autoRefresh ? "ON (800ms)" : "OFF"}
            </button>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Refrescar
            </button>
          </div>
        </div>

        {/* Alerta de Error si el servidor Python no está corriendo */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Servidor de Python no detectado en el puerto 8000</p>
              <p className="leading-relaxed">
                Inicia el motor concurrente ejecutando en tu terminal:
              </p>
              <code className="block bg-black/20 dark:bg-black/50 p-2 rounded-lg font-mono text-[11px] text-amber-900 dark:text-amber-200">
                py python_engine/server.py
              </code>
            </div>
          </div>
        )}

        {/* Tarjetas de Cuentas & Invariante de Saldo */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["A", "B", "C"].map((cuenta) => {
            const saldo = snapshot?.accounts[cuenta as "A" | "B" | "C"] ?? 1000;
            const lockOwner = (snapshot?.workers || []).find((w) => w.holding.includes(cuenta));

            return (
              <div
                key={cuenta}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cuenta {cuenta} (Recurso R_{cuenta})
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      lockOwner
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {lockOwner ? `Lock: ${lockOwner.name}` : "Lock Libre"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {saldo}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">unidades</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {lockOwner
                    ? `Retenido por TID ${lockOwner.tid}`
                    : "Disponible para exclusión mutua"}
                </p>
              </div>
            );
          })}

          {/* Tarjeta de Invariante Total S = 3000 */}
          <div
            className={`p-4 rounded-2xl border shadow-sm transition-colors ${
              snapshot?.accounts.invariant_satisfied
                ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
                : "border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Invariante Total (S = A + B + C)
              </span>
              {snapshot?.accounts.invariant_satisfied ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-bounce" />
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-black font-mono ${
                  snapshot?.accounts.invariant_satisfied
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {snapshot?.accounts.total ?? 3000}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 3000</span>
            </div>
            <p className="mt-2 text-[11px] font-semibold">
              {snapshot?.accounts.invariant_satisfied ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ Conservación de Saldo Íntegra
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  ✗ ¡CARRERA DETECTADA! (Actualización Perdida)
                </span>
              )}
            </p>
          </div>
        </section>

        {/* Panel Didáctico: Modo Paso a Paso o Escenarios de Demostración */}
        {stepMode ? (
          <section className="p-5 rounded-2xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-500/5 via-white to-indigo-500/10 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-indigo-950/20 shadow-md backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Control Paso a Paso en el Grafo
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold font-mono">
                      Paso {(snapshot?.step_info?.current_step ?? 0) + 1} de {snapshot?.step_info?.total_steps || 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Navega atómicamente por la evolución de aristas, posesiones y condiciones de Coffman.
                  </p>
                </div>
              </div>

              {/* Selector de Escenario para el Paso a Paso */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                {[
                  { id: "DEADLOCK", label: "Interbloqueo (8 Pasos)" },
                  { id: "RACE", label: "Carrera sin Lock (4 Pasos)" },
                  { id: "NORMAL", label: "Modo Normal (4 Pasos)" },
                ].map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => changeStepScenario(sc.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedStepScenario === sc.id
                        ? "bg-indigo-600 text-white shadow-sm font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta Explicativa del Paso Actual */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900/90 shadow-sm space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  {snapshot?.step_info?.title || "Paso en curso"}
                </span>
                {snapshot?.step_info?.os_concept && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono font-medium">
                    {snapshot.step_info.os_concept}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {snapshot?.step_info?.description || "Utiliza los controles inferiores para avanzar o retroceder."}
              </p>
            </div>

            {/* Barra de Botones de Navegación Paso a Paso */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sendAction("step/prev")}
                  disabled={!snapshot?.step_info?.can_prev || isPending}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Paso Anterior
                </button>

                <button
                  onClick={() => sendAction("step/next")}
                  disabled={!snapshot?.step_info?.can_next || isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  Siguiente Paso
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => sendAction("step/reset")}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar Secuencia (Paso 0)
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* Barra de Acciones de las 4 Escenas de Demostración Continua */
          <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" />
                Escenarios de Demostración de Laboratorio (4 Fases)
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Escenario actual:{" "}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {snapshot?.scenario ?? "IDLE"}
                </strong>
              </span>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Escena 1: Normal */}
            <button
              onClick={() => sendAction("normal", { count: 4 })}
              disabled={isPending}
              className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  1. Modo Normal
                </span>
                <Play className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Locks ordenados (A antes que B). Sin esperas circulares.
              </p>
            </button>

            {/* Escena 2: Carrera Desprotegida */}
            <button
              onClick={() => sendAction("race-condition", { protected: false })}
              disabled={isPending}
              className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  2. Carrera (Sin Locks)
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Barrier(2) sincroniza lecturas. Suma pasa a 3100.
              </p>
            </button>

            {/* Escena 2b: Carrera Protegida */}
            <button
              onClick={() => sendAction("race-condition", { protected: true })}
              disabled={isPending}
              className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-cyan-500 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                  2b. Carrera Protegida
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Con exclusión mutua. A=700, Total permanece en 3000.
              </p>
            </button>

            {/* Escena 3: Interbloqueo Coffman */}
            <button
              onClick={() => sendAction("deadlock")}
              disabled={isPending}
              className="p-3 rounded-xl border border-amber-400/60 dark:border-amber-600/60 bg-amber-500/5 dark:bg-amber-950/30 hover:border-amber-500 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  3. Inyectar Deadlock
                </span>
                <GitBranch className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                T1 posee A y pide B. T2 posee B y pide A. Ciclo DFS.
              </p>
            </button>

            {/* Escena 4: Recuperación Guardián */}
            <button
              onClick={() => sendAction("recover")}
              disabled={isPending}
              className="p-3 rounded-xl border border-indigo-400/60 dark:border-indigo-600/60 bg-indigo-500/5 dark:bg-indigo-950/30 hover:border-indigo-500 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  4. Recuperar (Guardián)
                </span>
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Cancela cooperativamente a T2. T1 finaliza. S=3000.
              </p>
            </button>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              onClick={() => sendAction("reset")}
              disabled={isPending}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reiniciar Cuentas & Estado a 1000
            </button>
          </div>
        </section>
      )}

        {/* Zona Central: Grafo RAG (SVG) y Tabla de Hilos del SO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Grafo de Asignación de Recursos RAG (7 cols) */}
          <section className="lg:col-span-7 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Grafo de Asignación de Recursos (RAG Dinámico)
                </h2>
              </div>
              {snapshot?.rag.cycle_detected ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                  ¡INTERBLOQUEO DETECTADO POR DFS!
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Sin ciclos (Grafo acíclico)
                </span>
              )}
            </div>

            {/* Canvas SVG del RAG */}
            <div className="w-full h-88 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center p-2">
              <svg className="w-full h-full" viewBox="0 0 720 350">
                <defs>
                  {/* Flecha Posesión (Verde Esmeralda) */}
                  <marker
                    id="arrow-holding"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <polygon points="0,1 9,5 0,9" fill="#10B981" />
                  </marker>

                  {/* Flecha Espera (Ámbar) */}
                  <marker
                    id="arrow-waiting"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <polygon points="0,1 9,5 0,9" fill="#F59E0B" />
                  </marker>

                  {/* Flecha Ciclo Deadlock (Rojo) */}
                  <marker
                    id="arrow-cycle"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                  >
                    <polygon points="0,1 9,5 0,9" fill="#EF4444" />
                  </marker>

                  {/* Flecha Conflicto de Carrera (Rosa / Magenta) */}
                  <marker
                    id="arrow-race"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <polygon points="0,1 9,5 0,9" fill="#F43F5E" />
                  </marker>

                  {/* Filtro de resplandor para interbloqueo */}
                  <filter id="glow-cycle" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {(() => {
                  const scenario = snapshot?.scenario ?? "IDLE";
                  const isDeadlockOrRecovered = scenario === "DEADLOCK" || scenario === "RECOVERED";
                  const isRaceScenario = scenario === "RACE_UNPROTECTED" || scenario === "RACE_PROTECTED";

                  // Disposiciones geométricas adaptativas según el escenario pedagógico
                  let nodePositions: Record<
                    string,
                    { x: number; y: number; isRect: boolean; w: number; h: number; r: number }
                  >;

                  if (isDeadlockOrRecovered) {
                    // Distribución planar rectangular cíclica (A -> T1 -> B -> T2 -> A)
                    // Elimina completamente el cruce diagonal de aristas y la superposición de etiquetas
                    nodePositions = {
                      A: { x: 190, y: 80, isRect: true, w: 84, h: 52, r: 35 },
                      T1: { x: 450, y: 80, isRect: false, w: 60, h: 60, r: 30 },
                      B: { x: 450, y: 260, isRect: true, w: 84, h: 52, r: 35 },
                      T2: { x: 190, y: 260, isRect: false, w: 60, h: 60, r: 30 },
                      C: { x: 630, y: 170, isRect: true, w: 84, h: 52, r: 35 },
                    };
                  } else if (isRaceScenario) {
                    // Distribución enfocada en el recurso disputado (Cuenta A centrada en la parte superior)
                    nodePositions = {
                      A: { x: 360, y: 75, isRect: true, w: 84, h: 52, r: 35 },
                      B: { x: 160, y: 75, isRect: true, w: 84, h: 52, r: 35 },
                      C: { x: 560, y: 75, isRect: true, w: 84, h: 52, r: 35 },
                      T1: { x: 240, y: 265, isRect: false, w: 60, h: 60, r: 30 },
                      T2: { x: 480, y: 265, isRect: false, w: 60, h: 60, r: 30 },
                    };
                  } else {
                    // Modo Normal o Idle
                    nodePositions = {
                      A: { x: 160, y: 75, isRect: true, w: 84, h: 52, r: 35 },
                      B: { x: 360, y: 75, isRect: true, w: 84, h: 52, r: 35 },
                      C: { x: 560, y: 75, isRect: true, w: 84, h: 52, r: 35 },
                      Trabajador_1: { x: 120, y: 265, isRect: false, w: 56, h: 56, r: 28 },
                      Trabajador_2: { x: 280, y: 265, isRect: false, w: 56, h: 56, r: 28 },
                      Trabajador_3: { x: 440, y: 265, isRect: false, w: 56, h: 56, r: 28 },
                      Trabajador_4: { x: 600, y: 265, isRect: false, w: 56, h: 56, r: 28 },
                      T1: { x: 240, y: 265, isRect: false, w: 60, h: 60, r: 30 },
                      T2: { x: 480, y: 265, isRect: false, w: 60, h: 60, r: 30 },
                      Guardián: { x: 640, y: 265, isRect: false, w: 56, h: 56, r: 28 },
                    };
                  }

                  // Función para calcular punto en el borde perimetral del nodo
                  const getBoundaryPoint = (
                    fromX: number,
                    fromY: number,
                    toX: number,
                    toY: number,
                    node: { isRect: boolean; w: number; h: number; r: number },
                    isTarget: boolean
                  ) => {
                    const dx = toX - fromX;
                    const dy = toY - fromY;
                    const angle = Math.atan2(dy, dx);
                    const targetAngle = isTarget ? angle + Math.PI : angle;

                    let offset = node.r;
                    if (node.isRect) {
                      const cos = Math.abs(Math.cos(targetAngle));
                      const sin = Math.abs(Math.sin(targetAngle));
                      const halfW = node.w / 2;
                      const halfH = node.h / 2;
                      if (cos * halfH > sin * halfW) {
                        offset = halfW / (cos || 0.0001);
                      } else {
                        offset = halfH / (sin || 0.0001);
                      }
                    }

                    // Margen adicional si es destino para no encimar el marcador de flecha
                    const finalOffset = isTarget ? offset + 8 : offset;
                    const baseX = isTarget ? toX : fromX;
                    const baseY = isTarget ? toY : fromY;
                    const sign = isTarget ? -1 : 1;

                    return {
                      x: baseX + sign * Math.cos(angle) * finalOffset,
                      y: baseY + sign * Math.sin(angle) * finalOffset,
                    };
                  };

                  const edges = snapshot?.rag.edges || [];
                  const cycleEdges = snapshot?.rag.cycle_edges || [];
                  const cycleNodes = new Set(snapshot?.rag.cycle_path || []);

                  return (
                    <>
                      {/* 1. Dibujar Aristas */}
                      {edges.map((edge, i) => {
                        const fromNode = nodePositions[edge.from] || {
                          x: 200,
                          y: 150,
                          isRect: false,
                          w: 60,
                          h: 60,
                          r: 30,
                        };
                        const toNode = nodePositions[edge.to] || {
                          x: 400,
                          y: 150,
                          isRect: false,
                          w: 60,
                          h: 60,
                          r: 30,
                        };

                        const isCycleEdge = cycleEdges.some(
                          (ce) => ce[0] === edge.from && ce[1] === edge.to
                        );
                        const isRaceEdge = edge.type === "RACE_CONFLICT";

                        const dx = toNode.x - fromNode.x;
                        const dy = toNode.y - fromNode.y;
                        const dist = Math.hypot(dx, dy) || 1;
                        const perpX = -dy / dist;
                        const perpY = dx / dist;

                        // En Deadlock o Carrera usamos trazos directos sin abultamiento para máxima claridad
                        const curveFactor = isDeadlockOrRecovered ? 0 : isRaceEdge ? 0 : 20;
                        const midX = (fromNode.x + toNode.x) / 2 + perpX * curveFactor;
                        const midY = (fromNode.y + toNode.y) / 2 + perpY * curveFactor;

                        const start = getBoundaryPoint(fromNode.x, fromNode.y, midX, midY, fromNode, false);
                        const end = getBoundaryPoint(midX, midY, toNode.x, toNode.y, toNode, true);

                        const strokeColor = isCycleEdge
                          ? "#EF4444"
                          : isRaceEdge
                          ? "#F43F5E"
                          : edge.type === "HOLDING"
                          ? "#10B981"
                          : "#F59E0B";

                        const markerId = isCycleEdge
                          ? "url(#arrow-cycle)"
                          : isRaceEdge
                          ? "url(#arrow-race)"
                          : edge.type === "HOLDING"
                          ? "url(#arrow-holding)"
                          : "url(#arrow-waiting)";

                        const pathData =
                          isDeadlockOrRecovered || isRaceEdge
                            ? `M ${start.x} ${start.y} L ${end.x} ${end.y}`
                            : `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

                        // Posición de la pastilla de texto sobre la arista
                        const labelX =
                          isDeadlockOrRecovered || isRaceEdge
                            ? (start.x + end.x) / 2
                            : 0.25 * start.x + 0.5 * midX + 0.25 * end.x;
                        const labelY =
                          isDeadlockOrRecovered || isRaceEdge
                            ? (start.y + end.y) / 2
                            : 0.25 * start.y + 0.5 * midY + 0.25 * end.y;

                        const labelText = isCycleEdge
                          ? "DEADLOCK"
                          : isRaceEdge
                          ? "Lee sin Lock"
                          : edge.type === "HOLDING"
                          ? "Posee"
                          : "Espera";

                        const badgeW = isRaceEdge ? 70 : 54;

                        return (
                          <g key={`edge-${edge.from}-${edge.to}-${i}`}>
                            <path
                              d={pathData}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={isCycleEdge ? "3" : isRaceEdge ? "2.5" : "2"}
                              strokeDasharray={
                                isRaceEdge ? "6 3" : edge.type === "WAITING" ? "5 4" : undefined
                              }
                              markerEnd={markerId}
                              className={isCycleEdge ? "animate-pulse" : ""}
                              filter={isCycleEdge ? "url(#glow-cycle)" : undefined}
                            />
                            {/* Pastilla con fondo para legibilidad */}
                            <g transform={`translate(${labelX}, ${labelY})`}>
                              <rect
                                x={-badgeW / 2}
                                y="-9"
                                width={badgeW}
                                height="18"
                                rx="5"
                                fill="#0F172A"
                                stroke={strokeColor}
                                strokeWidth="1.5"
                              />
                              <text
                                y="3.5"
                                fill={strokeColor}
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {labelText}
                              </text>
                            </g>
                          </g>
                        );
                      })}

                      {/* 2. Dibujar Nodos de Recursos (Locks A, B, C) */}
                      {["A", "B", "C"].map((res) => {
                        const pos = nodePositions[res];
                        if (!pos) return null;
                        const owner = (snapshot?.workers || []).find((w) => w.holding.includes(res));
                        const inCycle = cycleNodes.has(res);
                        const isContestedRace = isRaceScenario && res === "A";
                        const saldo = snapshot?.accounts[res as "A" | "B" | "C"] ?? 1000;

                        return (
                          <g key={`node-res-${res}`} transform={`translate(${pos.x}, ${pos.y})`}>
                            <rect
                              x={-pos.w / 2}
                              y={-pos.h / 2}
                              width={pos.w}
                              height={pos.h}
                              rx="10"
                              fill={
                                inCycle
                                  ? "#450A0A"
                                  : isContestedRace && !snapshot?.accounts.invariant_satisfied
                                  ? "#4C0519"
                                  : owner
                                  ? "#0F172A"
                                  : "#1E293B"
                              }
                              stroke={
                                inCycle
                                  ? "#EF4444"
                                  : isContestedRace && !snapshot?.accounts.invariant_satisfied
                                  ? "#F43F5E"
                                  : owner
                                  ? "#3B82F6"
                                  : "#64748B"
                              }
                              strokeWidth={inCycle ? "3" : isContestedRace ? "2.5" : "2"}
                              filter={inCycle ? "url(#glow-cycle)" : undefined}
                              className={inCycle ? "animate-pulse" : ""}
                            />
                            <text y="-8" fill="#F8FAFC" fontSize="12" fontWeight="bold" textAnchor="middle">
                              Lock {res}
                            </text>
                            <text
                              y="7"
                              fill={
                                inCycle
                                  ? "#FCA5A5"
                                  : isContestedRace && !snapshot?.accounts.invariant_satisfied
                                  ? "#FDA4AF"
                                  : owner
                                  ? "#60A5FA"
                                  : "#94A3B8"
                              }
                              fontSize="9"
                              textAnchor="middle"
                            >
                              {inCycle
                                ? "¡BLOQUEADO!"
                                : isContestedRace && !snapshot?.accounts.invariant_satisfied
                                ? "¡CARRERA EN A!"
                                : owner
                                ? `Retenido: ${owner.name}`
                                : "Libre"}
                            </text>
                            <text y="20" fill="#94A3B8" fontSize="8" fontStyle="italic" textAnchor="middle">
                              Saldo: {saldo}u
                            </text>
                          </g>
                        );
                      })}

                      {/* 3. Dibujar Nodos de Hilos */}
                      {(() => {
                        const threadNodes = (snapshot?.rag.nodes || []).filter((n) => n.type === "THREAD");

                        if (threadNodes.length === 0) {
                          return (
                            <g transform="translate(360, 265)">
                              <rect
                                x="-190"
                                y="-18"
                                width="380"
                                height="36"
                                rx="10"
                                fill="#1E293B"
                                stroke="#334155"
                                strokeDasharray="4 4"
                              />
                              <text y="4" fill="#94A3B8" fontSize="11" textAnchor="middle">
                                Sin hilos activos en el SO. Selecciona un escenario arriba para iniciar.
                              </text>
                            </g>
                          );
                        }

                        return threadNodes.map((node) => {
                          const pos = nodePositions[node.id] || {
                            x: 360,
                            y: 265,
                            isRect: false,
                            w: 60,
                            h: 60,
                            r: 30,
                          };
                          const inCycle = cycleNodes.has(node.id);
                          const workerData = (snapshot?.workers || []).find((w) => w.name === node.id);
                          const isHolding = workerData && workerData.holding.length > 0;
                          const isWaiting = workerData && Boolean(workerData.waiting);
                          const isRaceThread = isRaceScenario && (node.id === "T1" || node.id === "T2");

                          return (
                            <g key={`node-th-${node.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                              <circle
                                r={pos.r}
                                fill={
                                  inCycle
                                    ? "#7F1D1D"
                                    : isRaceThread && !snapshot?.accounts.invariant_satisfied
                                    ? "#881337"
                                    : isHolding
                                    ? "#064E3B"
                                    : isWaiting
                                    ? "#451A03"
                                    : "#0F172A"
                                }
                                stroke={
                                  inCycle
                                    ? "#EF4444"
                                    : isRaceThread && !snapshot?.accounts.invariant_satisfied
                                    ? "#F43F5E"
                                    : isHolding
                                    ? "#10B981"
                                    : isWaiting
                                    ? "#F59E0B"
                                    : "#475569"
                                }
                                strokeWidth={inCycle ? "3.5" : "2"}
                                strokeDasharray={!workerData ? "4 3" : undefined}
                                filter={inCycle ? "url(#glow-cycle)" : undefined}
                                className={inCycle ? "animate-pulse" : ""}
                              />
                              <text y="-4" fill="#F8FAFC" fontSize="11" fontWeight="bold" textAnchor="middle">
                                {node.id}
                              </text>
                              <text
                                y="9"
                                fill={
                                  inCycle
                                    ? "#FCA5A5"
                                    : isRaceThread && !snapshot?.accounts.invariant_satisfied
                                    ? "#FDA4AF"
                                    : isHolding
                                    ? "#6EE7B7"
                                    : isWaiting
                                    ? "#FCD34D"
                                    : "#94A3B8"
                                }
                                fontSize="8"
                                textAnchor="middle"
                              >
                                {inCycle
                                  ? "DEADLOCK"
                                  : workerData?.tid
                                  ? `TID ${workerData.tid}`
                                  : "En reposo"}
                              </text>
                              {workerData?.status && (
                                <text y="20" fill="#CBD5E1" fontSize="7" textAnchor="middle">
                                  {workerData.status.length > 18
                                    ? workerData.status.slice(0, 16) + "…"
                                    : workerData.status}
                                </text>
                              )}
                            </g>
                          );
                        });
                      })()}
                    </>
                  );
                })()}
              </svg>

              {/* Leyenda RAG */}
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded" />
                    Posesión (R → T)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded" />
                    Espera (T → R)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded" />
                    Ciclo Interbloqueo (Rojo)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-rose-400 border border-dashed border-rose-300 rounded" />
                    Acceso Carrera (Rosa)
                  </span>
                </div>
                {snapshot?.rag.cycle_detected && (
                  <span className="text-rose-400 font-mono font-bold">
                    Ciclo: {snapshot.rag.cycle_path.join(" → ")}
                  </span>
                )}
              </div>
            </div>

            {/* Detalle del Algoritmo DFS */}
            <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                Detección Formal por DFS (Depth-First Search):
              </p>
              <p className="mt-1 text-[11px] leading-relaxed">
                El guardián explora las listas de adyacencia de propietarios y esperas. Con una instancia por recurso,
                un ciclo dirigido equivale matemáticamente a las 4 condiciones de Coffman (exclusión mutua, retención y espera, no expropiación y espera circular).
              </p>
            </div>
          </section>

          {/* Tabla de Hilos y TIDs Nativo del SO (5 cols) */}
          <section className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hilos del SO (`threading.Thread`)
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                PID: <strong className="text-emerald-500">{pid}</strong>
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
                    <th className="pb-2">Hilo</th>
                    <th className="pb-2">TID Nativo</th>
                    <th className="pb-2">Posee</th>
                    <th className="pb-2">Espera</th>
                    <th className="pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {(snapshot?.workers || []).map((w) => (
                    <tr key={w.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {w.name}
                      </td>
                      <td className="py-2.5 text-cyan-600 dark:text-cyan-400 font-bold">
                        {w.tid}
                      </td>
                      <td className="py-2.5">
                        {w.holding.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            {w.holding.join(", ")}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {w.waiting ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                            {w.waiting}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            w.status === "DEADLOCKED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              : w.status === "WAITING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : w.status === "CRITICAL_SECTION"
                              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!snapshot?.workers || snapshot.workers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-sans text-xs">
                        Ejecuta una acción arriba para instanciar hilos del SO.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sección de Comprobación Externa en Linux / Azure */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                  Comandos de Evidencia Linux / Azure
                </span>
                <span className="text-[10px] text-slate-400">WSL2 / Ubuntu / Azure VM</span>
              </div>

              {[
                { label: "Ver hilos vivos en Linux", cmd: `ps -L -p ${pid}` },
                { label: "Consultar tareas en /proc", cmd: `ls -l /proc/${pid}/task` },
                { label: "Inspeccionar hilos en PowerShell", cmd: `Get-Process -Id ${pid} | Select -ExpandProperty Threads` },
              ].map(({ label, cmd }, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                >
                  <div className="truncate mr-2">
                    <span className="text-slate-400 block text-[9px] font-sans">{label}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{cmd}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cmd, `cmd-${idx}`)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    title="Copiar comando"
                  >
                    {copiedCmd === `cmd-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Bitácora Cronológica de Eventos del Kernel */}
        <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Bitácora Cronológica de Eventos (Kernel Audit Log)
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {["ALL", "DEADLOCK", "RACE", "LOCKS"].map((fil) => (
                <button
                  key={fil}
                  onClick={() => setEventFilter(fil)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    eventFilter === fil
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {fil === "ALL" ? "Todos" : fil}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold">#{evt.id}</span>
                  <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      evt.event_type.includes("DEADLOCK")
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        : evt.event_type.includes("CANCEL")
                        ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                        : evt.event_type.includes("RACE")
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : evt.event_type === "ADQUISICIÓN"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : evt.event_type === "ESPERA"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {evt.event_type}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    [{evt.thread_name} TID {evt.tid}]
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 truncate">
                    {evt.detail}
                  </span>
                </div>
                {evt.resource && (
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                    Recurso: {evt.resource}
                  </span>
                )}
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay eventos registrados para el filtro seleccionado.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
