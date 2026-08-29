"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Layers,
  GraduationCap,
  ShieldCheck,
  Server,
  ArrowRight,
  FolderGit2,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface StatusData {
  connected: boolean;
  databaseName?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
  tip?: string;
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
          setFormSuccess("¡Elemento guardado en MongoDB con éxito!");
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
    <main className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      {/* Barra de navegación superior */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">Wiki Next.js</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-0.5">
                Fullstack Template • MongoDB • Render
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {loadingStatus ? (
              <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 animate-pulse">
                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin text-cyan-600 dark:text-cyan-400" />
                Comprobando BD...
              </span>
            ) : status?.connected ? (
              <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-2 animate-ping" />
                MongoDB Conectado ({status.latencyMs}ms)
              </span>
            ) : (
              <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500 dark:text-amber-400" />
                Sin conexión a MongoDB
              </span>
            )}

            {/* Botón de alternancia Claro / Oscuro */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-10">
        {/* Banner Hero */}
        <div className="mb-10 text-center md:text-left md:flex md:items-center md:justify-between border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-2xl transition-colors">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 mb-4">
              <GraduationCap className="w-4 h-4" />
              <span>Compatible con GitHub Student Developer Pack</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
              Terreno preparado para tu aplicación Fullstack
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Frontend en <strong>Next.js App Router</strong>, backend mediante <strong>Route Handlers</strong>,
              conexión optimizada con <strong>Mongoose / MongoDB Atlas</strong> y blueprint listo para desplegar en <strong>Render</strong>.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <a
              href="#guia-mongo"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            >
              <Database className="w-4 h-4 mr-2" />
              Configurar MongoDB
            </a>
            <a
              href="#guia-render"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Cloud className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
              Desplegar en Render
            </a>
          </div>
        </div>

        {/* Sección de Estado y Diagnóstico de la Base de Datos */}
        <section className="mb-10">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Estado de la Base de Datos</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprobación en vivo contra el endpoint{" "}
                    <code className="text-emerald-600 dark:text-emerald-400 font-mono">/api/status</code>
                  </p>
                </div>
              </div>
              <button
                onClick={checkStatus}
                disabled={loadingStatus}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingStatus ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>

            {loadingStatus ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 animate-pulse text-sm">
                Realizando ping a MongoDB Atlas...
              </div>
            ) : status?.connected ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-emerald-500/20">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Estado</span>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Conectado con éxito
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Base de Datos</span>
                  <div className="text-slate-800 dark:text-slate-200 font-mono text-sm">
                    {status.databaseName || "default"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Latencia del Ping</span>
                  <div className="flex items-center text-slate-800 dark:text-slate-200 font-mono text-sm">
                    <Clock className="w-4 h-4 mr-1.5 text-cyan-600 dark:text-cyan-400" />
                    {status.latencyMs} ms
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      {status?.error || "MongoDB aún no está conectado"}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-200/80 mt-1">
                      {status?.message ||
                        "Crea tu archivo .env.local y define la variable MONGODB_URI con tu cadena de conexión."}
                    </p>
                    {status?.tip && (
                      <p className="text-xs text-amber-800 dark:text-amber-400/90 mt-2 font-medium">
                        💡 Tip: {status.tip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sección Interactiva: Prueba de Escritura / Lectura (CRUD) */}
        <section className="mb-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm transition-colors">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Probar Creación de Ítem
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Envía datos al endpoint <code className="text-slate-700 dark:text-slate-300 font-mono">POST /api/items</code>.
            </p>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título del Artículo / Nota
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Mi primer documento de wiki"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="General">General</option>
                  <option value="Arquitectura">Arquitectura</option>
                  <option value="Tutoriales">Tutoriales</option>
                  <option value="Notas">Notas</option>
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
                  placeholder="Escribe el contenido aquí..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
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
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Guardando en MongoDB...
                  </>
                ) : (
                  <>Guardar en MongoDB</>
                )}
              </button>
            </form>
          </div>

          {/* Lista de Registros */}
          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm flex flex-col transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Elementos en la Base de Datos</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lectura en tiempo real de <code className="text-slate-700 dark:text-slate-300 font-mono">GET /api/items</code>
                </p>
              </div>
              <button
                onClick={fetchItems}
                disabled={loadingItems}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center transition-colors"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loadingItems ? "animate-spin" : ""}`} />
                Refrescar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[340px] space-y-3 pr-1">
              {loadingItems ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Cargando elementos...</div>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">{item.content}</p>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      ID: <span className="font-mono">{item._id}</span> •{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No hay elementos guardados aún en la colección.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Usa el formulario a la izquierda para crear tu primer registro una vez conectes MongoDB.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Guías Paso a Paso */}
        <section className="space-y-6">
          {/* Guía MongoDB Atlas */}
          <div id="guia-mongo" className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 p-6 shadow-sm transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  1. Configuración de MongoDB Atlas (GitHub Student Pack)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aprovecha el beneficio de estudiante y conecta tu base de datos
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
              <li className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Accede a GitHub Student Pack:</strong> Entra a{" "}
                <a
                  href="https://education.github.com/pack"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center font-medium"
                >
                  education.github.com/pack <ExternalLink className="w-3 h-3 ml-1" />
                </a>{" "}
                y canjea la oferta de <strong>MongoDB</strong> ($50 - $200 en créditos de Atlas).
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Crea tu Cluster:</strong> En el panel de MongoDB Atlas, crea un cluster (el cluster M0 Sandbox es gratuito de por vida, o usa tus créditos para M2/M5).
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Crea el Usuario de Base de Datos:</strong> Ve a{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">Security &gt; Database Access</span>, crea un usuario con usuario y contraseña (guárdala bien).
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Habilita Acceso de Red (Importante para Render):</strong> Ve a{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">Security &gt; Network Access</span> y añade la IP{" "}
                <code className="bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">0.0.0.0/0</code>{" "}
                (permite conexión desde cualquier IP, indispensable para que los servidores de Render se comuniquen con Atlas).
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Obtén la cadena de conexión:</strong> Pulsa en <em>Connect</em> &gt; <em>Drivers (Node.js)</em> y copia la URI.
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Configura tu entorno local:</strong> Crea o edita tu archivo{" "}
                <code className="bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">.env.local</code>{" "}
                con el siguiente contenido:
                <pre className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-mono text-xs overflow-x-auto border border-slate-200 dark:border-slate-800">
                  MONGODB_URI=mongodb+srv://&lt;usuario&gt;:&lt;password&gt;@cluster0.xxxxx.mongodb.net/wiki?retryWrites=true&amp;w=majority
                </pre>
              </li>
            </ol>
          </div>

          {/* Guía Render */}
          <div id="guia-render" className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 p-6 shadow-sm transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  2. Despliegue en Render (Render Blueprint Listo)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tu proyecto ya incluye el archivo <code className="font-mono text-purple-600 dark:text-purple-400">render.yaml</code>
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p>
                Para desplegar tu proyecto en <strong>Render</strong> de forma automática:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center mb-2">
                    <FolderGit2 className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                    Opción 1: Render Blueprints (Automático)
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <li>Sube tu código a un repositorio en GitHub.</li>
                    <li>
                      En Render, haz clic en <strong>New +</strong> &gt; <strong>Blueprint</strong>.
                    </li>
                    <li>Conecta tu repositorio de GitHub.</li>
                    <li>
                      Render detectará automáticamente el archivo{" "}
                      <code className="text-purple-600 dark:text-purple-300">render.yaml</code>.
                    </li>
                    <li>
                      Rellena la variable de entorno <code className="text-emerald-600 dark:text-emerald-400">MONGODB_URI</code> y pulsa <strong>Apply</strong>.
                    </li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center mb-2">
                    <Server className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Opción 2: Web Service Manual
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <li>
                      <strong>Build Command:</strong>{" "}
                      <code className="text-slate-800 dark:text-slate-200">npm install &amp;&amp; npm run build</code>
                    </li>
                    <li>
                      <strong>Start Command:</strong>{" "}
                      <code className="text-slate-800 dark:text-slate-200">npm run start</code>
                    </li>
                    <li>
                      <strong>Health Check Path:</strong>{" "}
                      <code className="text-slate-800 dark:text-slate-200">/api/health</code>
                    </li>
                    <li>
                      <strong>Environment Variables:</strong> Añade{" "}
                      <code className="text-emerald-600 dark:text-emerald-400">MONGODB_URI</code> con tu URI de Atlas.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoints de API disponibles */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 p-6 shadow-sm transition-colors">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400" />
              Endpoints de Backend Creados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <a
                href="/api/health"
                target="_blank"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors block"
              >
                <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 font-mono font-semibold mb-1">
                  <span>GET /api/health</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Verifica el estado del servicio y uptime (usado por el health check de Render).
                </p>
              </a>

              <a
                href="/api/status"
                target="_blank"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors block"
              >
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-mono font-semibold mb-1">
                  <span>GET /api/status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Realiza un ping a MongoDB Atlas y reporta latencia y detalles de conexión.
                </p>
              </a>

              <a
                href="/api/items"
                target="_blank"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors block"
              >
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-mono font-semibold mb-1">
                  <span>GET &amp; POST /api/items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Operaciones CRUD completas interactuando con tu colección en MongoDB.
                </p>
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
