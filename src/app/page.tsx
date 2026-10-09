"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import Navbar from "@/components/Navbar";
import {
  Database,
  Cpu,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  GitBranch,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface StatusData {
  connected: boolean;
  databaseName?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}

interface ItemData {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export default function Home() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [items, setItems] = useState<ItemData[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/items");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Error al cargar ítems:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  const checkStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        fetchItems();
      }
    } catch {
      setStatus({
        connected: false,
        error: "Error de red al consultar el estado de la API",
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initialize() {
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        if (ignore) return;
        setStatus(data);

        if (data.connected) {
          const itemsRes = await fetch("/api/items");
          const json = await itemsRes.json();
          if (ignore) return;
          if (json.success && Array.isArray(json.data)) {
            setItems(json.data);
          }
        }
      } catch {
        if (!ignore) {
          setStatus({
            connected: false,
            error: "Error de red al consultar el estado de la API",
          });
        }
      } finally {
        if (!ignore) {
          setLoadingStatus(false);
        }
      }
    }

    initialize();

    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim() || !content.trim()) {
      setFormError("Por favor completa el título y el contenido.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, category }),
        });
        const data = await res.json();

        if (data.success) {
          setFormSuccess("¡Registro guardado con éxito!");
          setTitle("");
          setContent("");
          fetchItems();
        } else {
          setFormError(data.error || "No se pudo guardar el elemento.");
        }
      } catch {
        setFormError("Error de conexión al enviar el formulario.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Banner Principal "En Desarrollo" */}
        <section className="relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>En Desarrollo Activo</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Desplegado en Render</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
              Wiki Sistemas Operativos 1
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Aplicación web construida con <strong>Next.js (App Router)</strong>, base de datos en{" "}
              <strong>MongoDB Atlas</strong>
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/concurrency"
                className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 hover:scale-[1.02]"
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Motor Concurrente (Hilos SO)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <Link
                href="/memory-simulator"
                className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 hover:scale-[1.02]"
              >
                <Cpu className="w-4 h-4 mr-2" />
                Simulador RAM (1024 MB)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <a
                href="#seccion-bd"
                className="inline-flex items-center px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <Database className="w-4 h-4 mr-2 text-emerald-500" />
                Probar Base de Datos
              </a>
            </div>
          </div>
        </section>

        {/* Sección de Diagnóstico y Prueba Rápida de Base de Datos */}
        <section id="seccion-bd" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Prueba de Conexión & CRUD (MongoDB Atlas)
              </h2>
            </div>

            {/* Estado de conexión con Atlas */}
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  status?.connected
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                }`}
              >
                {status?.connected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Conectado: {status.databaseName} ({status.latencyMs}ms)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{loadingStatus ? "Verificando..." : "Sin conexión a Atlas"}</span>
                  </>
                )}
              </div>

              <button
                onClick={checkStatus}
                disabled={loadingStatus}
                className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Comprobar ping de base de datos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario */}
            <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center">
                <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                Guardar Nuevo Registro
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Envía un documento a la colección en MongoDB.
              </p>

              <form onSubmit={handleCreateItem} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Tarea 1 - Sistemas Operativos"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="General">General</option>
                    <option value="Sistemas Operativos">Sistemas Operativos</option>
                    <option value="Memoria">Memoria RAM</option>
                    <option value="Notas">Notas de Clase</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contenido
                  </label>
                  <textarea
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escribe una breve descripción..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {formError && (
                  <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-2.5 rounded-lg">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-2.5 rounded-lg">
                    {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isPending ? "Guardando..." : "Guardar en MongoDB"}
                </button>
              </form>
            </div>

            {/* Lista de Registros */}
            <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Registros Guardados ({items.length})
                </h3>
                <button
                  onClick={fetchItems}
                  disabled={loadingItems}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loadingItems ? "animate-spin" : ""}`} />
                  Refrescar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1">
                {loadingItems ? (
                  <div className="p-8 text-center text-xs text-slate-400">Cargando datos...</div>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-1.5">
                        {item.content}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No hay registros guardados en MongoDB todavía.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
