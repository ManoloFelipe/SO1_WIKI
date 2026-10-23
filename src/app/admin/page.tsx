"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Lock,
  PlusCircle,
  Pencil,
  Trash2,
  LogOut,
  Save,
  X,
  Upload,
  FolderCheck,
  Layers,
  BookOpen,
  Palette,
  Type,
  Image as ImageIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  apiPath,
  getFontFamilyCss,
  getFontSizeClasses,
  getSeparadorCardStyle,
  resolveImageUrl,
  type SeparadorItem,
  type TemaItem,
} from "@/lib/wikiStyles";

interface UploadDirInfo {
  directory: string;
  platform: string;
  writable: boolean;
  readable: boolean;
  modeOctal: string;
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500";

const COLOR_PRESETS = [
  {
    name: "Esmeralda Oscuro",
    textColor: "#f8fafc",
    bgColor: "#0f172a",
    accentColor: "#10b981",
  },
  {
    name: "Cian Tecnológico",
    textColor: "#ecfeff",
    bgColor: "#083344",
    accentColor: "#06b6d4",
  },
  {
    name: "Índigo Profundo",
    textColor: "#eef2ff",
    bgColor: "#1e1b4b",
    accentColor: "#6366f1",
  },
  {
    name: "Ámbar Cálido",
    textColor: "#fffbeb",
    bgColor: "#27272a",
    accentColor: "#f59e0b",
  },
  {
    name: "Claro Académico",
    textColor: "#0f172a",
    bgColor: "#ffffff",
    accentColor: "#059669",
  },
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [logged, setLogged] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"separadores" | "temas">(
    "separadores"
  );
  const [dirInfo, setDirInfo] = useState<UploadDirInfo | null>(null);

  // Estado de Separadores (Unidades)
  const [separadores, setSeparadores] = useState<SeparadorItem[]>([]);
  const [sepEditId, setSepEditId] = useState<string | null>(null);
  const [sepTitle, setSepTitle] = useState("");
  const [sepDescription, setSepDescription] = useState("");
  const [sepOrder, setSepOrder] = useState(1);
  const [sepImageUrl, setSepImageUrl] = useState("");
  const [sepTextColor, setSepTextColor] = useState("#f8fafc");
  const [sepBgColor, setSepBgColor] = useState("#0f172a");
  const [sepAccentColor, setSepAccentColor] = useState("#10b981");
  const [sepFontFamily, setSepFontFamily] = useState("sans");
  const [sepFontSize, setSepFontSize] = useState("base");
  const [sepMsg, setSepMsg] = useState("");
  const [sepSaving, setSepSaving] = useState(false);
  const [uploadingSepImg, setUploadingSepImg] = useState(false);

  // Estado de Temas (Contenidos dentro de cada Separador)
  const [temas, setTemas] = useState<TemaItem[]>([]);
  const [temaEditId, setTemaEditId] = useState<string | null>(null);
  const [temaTitle, setTemaTitle] = useState("");
  const [temaSeparadorId, setTemaSeparadorId] = useState("");
  const [temaContent, setTemaContent] = useState("");
  const [temaImageUrl, setTemaImageUrl] = useState("");
  const [temaMsg, setTemaMsg] = useState("");
  const [temaSaving, setTemaSaving] = useState(false);
  const [uploadingTemaImg, setUploadingTemaImg] = useState(false);

  const cargarTodo = useCallback(async () => {
    const [sepRes, temaRes, upRes] = await Promise.all([
      fetch(apiPath("/api/separadores")).then((r) => r.json()).catch(() => ({ success: false })),
      fetch(apiPath("/api/temas")).then((r) => r.json()).catch(() => ({ success: false })),
      fetch(apiPath("/api/uploads")).then((r) => r.json()).catch(() => ({ success: false })),
    ]);

    if (sepRes.success && Array.isArray(sepRes.data)) {
      setSeparadores(sepRes.data);
      setTemaSeparadorId((prev) =>
        prev || (sepRes.data[0]?._id ? String(sepRes.data[0]._id) : "")
      );
      setSepOrder((prev) =>
        sepEditId ? prev : (sepRes.data.length || 0) + 1
      );
    }
    if (temaRes.success && Array.isArray(temaRes.data)) {
      setTemas(temaRes.data);
    }
    if (upRes.success && upRes.data) {
      setDirInfo(upRes.data);
    }
  }, [sepEditId]);

  useEffect(() => {
    if (!logged) return;
    cargarTodo();
  }, [logged, cargarTodo]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch(apiPath("/api/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const d = await res.json();
    if (d.success) {
      setLogged(true);
    } else {
      setLoginError(d.error || "Error al iniciar sesión");
    }
  }

  function logout() {
    setLogged(false);
    setPassword("");
  }

  async function subirImagenAlServidor(
    file: File,
    onSuccess: (url: string) => void,
    setUploading: (v: boolean) => void,
    setStatusMsg: (m: string) => void
  ) {
    setUploading(true);
    setStatusMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiPath("/api/uploads"), {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
      });
      const d = await res.json();
      if (d.success && d.data?.url) {
        onSuccess(d.data.url);
        setStatusMsg(`Imagen subida correctamente (${d.data.filename})`);
      } else {
        setStatusMsg(d.error || "No se pudo subir la imagen");
      }
    } catch {
      setStatusMsg("Error de red al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  // ── Acciones de Separadores ──
  function limpiarSeparador() {
    setSepEditId(null);
    setSepTitle("");
    setSepDescription("");
    setSepOrder(separadores.length + 1);
    setSepImageUrl("");
    setSepTextColor("#f8fafc");
    setSepBgColor("#0f172a");
    setSepAccentColor("#10b981");
    setSepFontFamily("sans");
    setSepFontSize("base");
  }

  async function guardarSeparador(e: React.FormEvent) {
    e.preventDefault();
    setSepSaving(true);
    setSepMsg("");
    const res = await fetch(
      sepEditId
        ? apiPath(`/api/separadores/${sepEditId}`)
        : apiPath("/api/separadores"),
      {
        method: sepEditId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          title: sepTitle,
          description: sepDescription,
          order: sepOrder,
          imageUrl: sepImageUrl,
          textColor: sepTextColor,
          bgColor: sepBgColor,
          accentColor: sepAccentColor,
          fontFamily: sepFontFamily,
          fontSize: sepFontSize,
        }),
      }
    );
    const d = await res.json();
    setSepSaving(false);
    if (d.success) {
      setSepMsg(sepEditId ? "Separador actualizado" : "Separador creado");
      limpiarSeparador();
      cargarTodo();
    } else {
      setSepMsg(d.error || "Error al guardar separador");
    }
  }

  function editarSeparador(sep: SeparadorItem) {
    setSepEditId(sep._id);
    setSepTitle(sep.title);
    setSepDescription(sep.description || "");
    setSepOrder(sep.order || 1);
    setSepImageUrl(sep.imageUrl || "");
    setSepTextColor(sep.textColor || "#f8fafc");
    setSepBgColor(sep.bgColor || "#0f172a");
    setSepAccentColor(sep.accentColor || "#10b981");
    setSepFontFamily(sep.fontFamily || "sans");
    setSepFontSize(sep.fontSize || "base");
    setActiveTab("separadores");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function borrarSeparador(id: string, nombre: string) {
    if (
      !confirm(
        `¿Borrar el separador "${nombre}" y todos los temas asociados a esta unidad?`
      )
    )
      return;
    const res = await fetch(apiPath(`/api/separadores/${id}`), {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    const d = await res.json();
    setSepMsg(d.success ? "Separador eliminado" : d.error || "Error al borrar");
    cargarTodo();
  }

  // ── Acciones de Temas ──
  function limpiarTema() {
    setTemaEditId(null);
    setTemaTitle("");
    setTemaContent("");
    setTemaImageUrl("");
    if (separadores.length > 0 && !temaSeparadorId) {
      setTemaSeparadorId(separadores[0]._id);
    }
  }

  async function guardarTema(e: React.FormEvent) {
    e.preventDefault();
    if (!temaSeparadorId) {
      setTemaMsg("Primero selecciona o crea un separador/unidad.");
      return;
    }
    setTemaSaving(true);
    setTemaMsg("");

    const sepSeleccionado = separadores.find((s) => s._id === temaSeparadorId);
    const unitNum = sepSeleccionado ? sepSeleccionado.order : 1;

    const res = await fetch(
      temaEditId ? apiPath(`/api/temas/${temaEditId}`) : apiPath("/api/temas"),
      {
        method: temaEditId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          title: temaTitle,
          unit: unitNum,
          separadorId: temaSeparadorId,
          content: temaContent,
          imageUrl: temaImageUrl,
        }),
      }
    );
    const d = await res.json();
    setTemaSaving(false);
    if (d.success) {
      setTemaMsg(temaEditId ? "Tema actualizado" : "Tema creado");
      limpiarTema();
      cargarTodo();
    } else {
      setTemaMsg(d.error || "Error al guardar tema");
    }
  }

  async function editarTema(id: string) {
    const d = await fetch(apiPath(`/api/temas/${id}`)).then((r) => r.json());
    if (d.success && d.data) {
      setTemaEditId(id);
      setTemaTitle(d.data.title);
      setTemaContent(d.data.content);
      setTemaImageUrl(d.data.imageUrl || "");

      const matchedSep =
        separadores.find((s) => s._id === d.data.separadorId) ||
        separadores.find((s) => s.order === d.data.unit);
      if (matchedSep) {
        setTemaSeparadorId(matchedSep._id);
      }
      setActiveTab("temas");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function borrarTema(id: string, nombre: string) {
    if (!confirm(`¿Borrar el tema "${nombre}"?`)) return;
    const res = await fetch(apiPath(`/api/temas/${id}`), {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    const d = await res.json();
    setTemaMsg(d.success ? "Tema borrado" : d.error || "Error al borrar");
    cargarTodo();
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">
        {children}
      </main>
    </div>
  );

  if (!logged) {
    return shell(
      <form
        onSubmit={login}
        className="max-w-sm mx-auto w-full border border-slate-200 dark:border-slate-800 rounded-3xl p-8 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl space-y-4"
      >
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Lock className="w-5 h-5 text-emerald-500" /> Acceso de administrador
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ingresa la contraseña definida en <code>ADMIN_PASSWORD</code> para
          gestionar separadores, imágenes y contenidos de la Wiki.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className={inputClass}
          required
        />
        {loginError && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {loginError}
          </p>
        )}
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          Entrar
        </button>
      </form>
    );
  }

  const previewSizeClasses = getFontSizeClasses(sepFontSize);

  return shell(
    <>
      {/* Encabezado y Estado de Carpeta en la VM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Panel de Administración de la Wiki
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personaliza los separadores (unidades) con imágenes, colores y
            fuentes, y administra los temas de cada división.
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center self-start sm:self-auto text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Salir
        </button>
      </div>

      {/* Estado del directorio de imágenes en el servidor / VM Linux Ubuntu */}
      {dirInfo && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <FolderCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Carpeta de imágenes activa:</strong>{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono">
                {dirInfo.directory}
              </code>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span>SO: {dirInfo.platform}</span>
            <span>•</span>
            <span>Permisos: {dirInfo.modeOctal} (Lectura / Escritura OK)</span>
          </div>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("separadores")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "separadores"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Separadores / Unidades ({separadores.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("temas")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "temas"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          2. Contenidos / Temas ({temas.length})
        </button>
      </div>

      {/* ──────────────── PESTAÑA 1: SEPARADORES (UNIDADES) ──────────────── */}
      {activeTab === "separadores" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Formulario de Separador */}
            <form
              onSubmit={guardarSeparador}
              className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl space-y-5"
            >
              <h2 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
                {sepEditId ? (
                  <Pencil className="w-4 h-4 text-emerald-500" />
                ) : (
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                )}
                {sepEditId
                  ? "Editar separador / unidad"
                  : "Nuevo separador / unidad"}
              </h2>

              <div className="grid sm:grid-cols-[1fr_110px] gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nombre del separador (ej. Unidad 1: Introducción)
                  </label>
                  <input
                    value={sepTitle}
                    onChange={(e) => setSepTitle(e.target.value)}
                    placeholder="Ej. Unidad 1: Introducción a los SO"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Orden #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sepOrder}
                    onChange={(e) => setSepOrder(Number(e.target.value) || 1)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Descripción corta (se muestra en la tarjeta de la unidad)
                </label>
                <textarea
                  rows={2}
                  value={sepDescription}
                  onChange={(e) => setSepDescription(e.target.value)}
                  placeholder="Breve resumen de los temas que aborda esta unidad..."
                  className={inputClass}
                />
              </div>

              {/* Subida de imagen a la carpeta de la VM */}
              <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                  Imagen de portada del separador
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {uploadingSepImg
                      ? "Subiendo a la VM..."
                      : "Subir imagen desde tu equipo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      className="hidden"
                      disabled={uploadingSepImg}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          subirImagenAlServidor(
                            f,
                            (url) => setSepImageUrl(url),
                            setUploadingSepImg,
                            setSepMsg
                          );
                        }
                      }}
                    />
                  </label>

                  {sepImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSepImageUrl("")}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>

                <input
                  value={sepImageUrl}
                  onChange={(e) => setSepImageUrl(e.target.value)}
                  placeholder="URL de la imagen (se autocompleta al subir archivo)"
                  className={inputClass}
                />
              </div>

              {/* Personalización de Fuente y Tamaño */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-500" />
                  Tipografía del separador
                </label>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Fuente del texto
                    </label>
                    <select
                      value={sepFontFamily}
                      onChange={(e) => setSepFontFamily(e.target.value)}
                      className={inputClass}
                    >
                      {FONT_FAMILY_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Tamaño del texto
                    </label>
                    <select
                      value={sepFontSize}
                      onChange={(e) => setSepFontSize(e.target.value)}
                      className={inputClass}
                    >
                      {FONT_SIZE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Personalización de Colores */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-500" />
                    Colores de la tarjeta y del texto
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setSepTextColor(preset.textColor);
                          setSepBgColor(preset.bgColor);
                          setSepAccentColor(preset.accentColor);
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-colors"
                        title={`Aplicar combinación: ${preset.name}`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Color del texto
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={sepTextColor}
                        onChange={(e) => setSepTextColor(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        value={sepTextColor}
                        onChange={(e) => setSepTextColor(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Color de fondo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={sepBgColor}
                        onChange={(e) => setSepBgColor(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        value={sepBgColor}
                        onChange={(e) => setSepBgColor(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Color de borde / acento
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={sepAccentColor}
                        onChange={(e) => setSepAccentColor(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        value={sepAccentColor}
                        onChange={(e) => setSepAccentColor(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sepSaving}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {sepEditId ? "Guardar cambios" : "Crear separador"}
                </button>
                {sepEditId && (
                  <button
                    type="button"
                    onClick={limpiarSeparador}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </button>
                )}
                {sepMsg && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {sepMsg}
                  </span>
                )}
              </div>
            </form>

            {/* Vista Previa en Vivo de la Card */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Vista previa de la Card en la Wiki
              </h3>

              <div
                style={getSeparadorCardStyle({
                  textColor: sepTextColor,
                  bgColor: sepBgColor,
                  accentColor: sepAccentColor,
                  fontFamily: sepFontFamily,
                })}
                className="rounded-3xl border-2 overflow-hidden shadow-lg transition-all"
              >
                {sepImageUrl ? (
                  <div className="h-44 w-full overflow-hidden bg-slate-950/30 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveImageUrl(sepImageUrl)}
                      alt={sepTitle || "Vista previa"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${sepAccentColor}33, ${sepBgColor})`,
                    }}
                    className="h-28 w-full flex items-center justify-center border-b border-white/10"
                  >
                    <Layers
                      style={{ color: sepAccentColor }}
                      className="w-10 h-10 opacity-80"
                    />
                  </div>
                )}

                <div className="p-6 space-y-3">
                  <span
                    style={{
                      backgroundColor: `${sepAccentColor}22`,
                      color: sepAccentColor,
                      borderColor: `${sepAccentColor}55`,
                    }}
                    className="inline-block text-xs font-bold px-3 py-1 rounded-full border"
                  >
                    Separador #{sepOrder}
                  </span>

                  <h4 className={`font-extrabold ${previewSizeClasses.titleClass}`}>
                    {sepTitle || "Título de la Unidad / Separador"}
                  </h4>

                  <p className={`opacity-85 ${previewSizeClasses.bodyClass}`}>
                    {sepDescription ||
                      "Aquí aparecerá la descripción personalizada de esta división cuando los usuarios visiten la Wiki."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Separadores existentes */}
          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white">
              Separadores configurados ({separadores.length})
            </h2>

            {separadores.length === 0 && (
              <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500">
                Todavía no hay separadores creados. Crea el primero arriba.
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {separadores.map((sep) => {
                const countTemas = temas.filter(
                  (t) =>
                    t.separadorId === sep._id ||
                    (!t.separadorId && t.unit === sep.order)
                ).length;

                return (
                  <div
                    key={sep._id}
                    style={getSeparadorCardStyle(sep)}
                    className="rounded-2xl border-2 overflow-hidden flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      {sep.imageUrl && (
                        <div className="h-32 w-full overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sep.imageUrl}
                            alt={sep.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            style={{
                              backgroundColor: `${sep.accentColor}22`,
                              color: sep.accentColor,
                              borderColor: `${sep.accentColor}55`,
                            }}
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                          >
                            Orden #{sep.order} • {countTemas} tema(s)
                          </span>
                        </div>
                        <h3 className="font-bold text-base">{sep.title}</h3>
                        {sep.description && (
                          <p className="text-xs opacity-80 line-clamp-2">
                            {sep.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between bg-black/10">
                      <button
                        type="button"
                        onClick={() => {
                          setTemaSeparadorId(sep._id);
                          setActiveTab("temas");
                        }}
                        className="text-xs font-semibold underline opacity-90 hover:opacity-100"
                      >
                        + Agregar / ver temas
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => editarSeparador(sep)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                          title="Editar separador"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => borrarSeparador(sep._id, sep.title)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                          title="Borrar separador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ──────────────── PESTAÑA 2: TEMAS / CONTENIDOS ──────────────── */}
      {activeTab === "temas" && (
        <div className="space-y-8">
          <form
            onSubmit={guardarTema}
            className="border border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl space-y-4"
          >
            <h2 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
              {temaEditId ? (
                <Pencil className="w-4 h-4 text-emerald-500" />
              ) : (
                <PlusCircle className="w-4 h-4 text-emerald-500" />
              )}
              {temaEditId
                ? "Editar tema / contenido"
                : "Nuevo tema dentro de un separador"}
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Título del tema
                </label>
                <input
                  value={temaTitle}
                  onChange={(e) => setTemaTitle(e.target.value)}
                  placeholder="Ej. ¿Qué es un sistema operativo?"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Separador / Unidad donde se publicará
                </label>
                <select
                  value={temaSeparadorId}
                  onChange={(e) => setTemaSeparadorId(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="" disabled>
                    Selecciona un separador...
                  </option>
                  {separadores.map((sep) => (
                    <option key={sep._id} value={sep._id}>
                      #{sep.order} - {sep.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Imagen opcional para el tema */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploadingTemaImg
                    ? "Subiendo imagen..."
                    : "Adjuntar imagen al tema (opcional)"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    disabled={uploadingTemaImg}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        subirImagenAlServidor(
                          f,
                          (url) => setTemaImageUrl(url),
                          setUploadingTemaImg,
                          setTemaMsg
                        );
                      }
                    }}
                  />
                </label>

                {temaImageUrl && (
                  <button
                    type="button"
                    onClick={() => setTemaImageUrl("")}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Quitar imagen del tema
                  </button>
                )}
              </div>

              {temaImageUrl && (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={temaImageUrl}
                    alt="Preview tema"
                    className="h-16 w-24 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                  <input
                    value={temaImageUrl}
                    onChange={(e) => setTemaImageUrl(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Contenido teórico (los saltos de línea se respetan)
              </label>
              <textarea
                rows={10}
                value={temaContent}
                onChange={(e) => setTemaContent(e.target.value)}
                placeholder="Escribe aquí el desarrollo completo del tema..."
                className={inputClass}
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={temaSaving}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {temaEditId ? "Guardar cambios" : "Crear tema"}
              </button>
              {temaEditId && (
                <button
                  type="button"
                  onClick={limpiarTema}
                  className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </button>
              )}
              {temaMsg && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {temaMsg}
                </span>
              )}
            </div>
          </form>

          {/* Listado de Temas agrupados por Separador */}
          <section className="space-y-6">
            <h2 className="font-bold text-slate-900 dark:text-white">
              Temas guardados ({temas.length})
            </h2>

            {separadores.map((sep) => {
              const lista = temas.filter(
                (t) =>
                  t.separadorId === sep._id ||
                  (!t.separadorId && t.unit === sep.order)
              );
              return (
                <div key={sep._id} className="space-y-2">
                  <h3
                    style={{ fontFamily: getFontFamilyCss(sep.fontFamily) }}
                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
                  >
                    <span>
                      #{sep.order} • {sep.title}
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({lista.length} temas)
                    </span>
                  </h3>

                  {lista.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-2">
                      Sin temas en este separador todavía.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {lista.map((t) => (
                        <div
                          key={t._id}
                          className="flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 bg-white dark:bg-slate-900/60"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            {t.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={t.imageUrl}
                                alt={t.title}
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                              {t.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => editarTema(t._id)}
                              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              aria-label="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => borrarTema(t._id, t.title)}
                              className="p-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-500"
                              aria-label="Borrar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      )}
    </>
  );
}
