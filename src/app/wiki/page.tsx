"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Layers,
  Settings,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getFontFamilyCss,
  getFontSizeClasses,
  getSeparadorCardStyle,
  type SeparadorItem,
  type TemaItem,
} from "@/lib/wikiStyles";

export default function WikiPage() {
  const [separadores, setSeparadores] = useState<SeparadorItem[]>([]);
  const [temas, setTemas] = useState<TemaItem[]>([]);
  const [selectedSep, setSelectedSep] = useState<SeparadorItem | null>(null);
  const [selectedTemaId, setSelectedTemaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/separadores").then((r) => r.json()),
      fetch("/api/temas").then((r) => r.json()),
    ])
      .then(([sepRes, temaRes]) => {
        if (sepRes.success) {
          setSeparadores(sepRes.data);
        } else {
          setError(sepRes.error || "Error al cargar los separadores");
        }
        if (temaRes.success) {
          setTemas(temaRes.data);
        }
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  const temasDeSeparador = (sep: SeparadorItem) =>
    temas.filter(
      (t) =>
        t.separadorId === sep._id || (!t.separadorId && t.unit === sep.order)
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-emerald-500 shrink-0" />
              Conceptos de Sistemas Operativos 1
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {selectedSep
                ? `Explorando los contenidos de: ${selectedSep.title}`
                : "Selecciona una unidad o separador para leer los contenidos teóricos generados por el administrador."}
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            Administrar Wiki
          </Link>
        </div>

        {loading && (
          <div className="p-12 text-center text-sm text-slate-500">
            Cargando unidades y contenidos...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-600 dark:text-amber-400">
            {error}
          </div>
        )}

        {!loading && !error && separadores.length === 0 && (
          <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aún no hay separadores ni unidades publicadas.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Crear primer separador en /admin
            </Link>
          </div>
        )}

        {/* ────────────── VISTA 1: CARDS DE SEPARADORES (UNIDADES) ────────────── */}
        {!loading && !error && !selectedSep && separadores.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {separadores.map((sep) => {
              const lista = temasDeSeparador(sep);
              const sizeClasses = getFontSizeClasses(sep.fontSize);

              return (
                <button
                  key={sep._id}
                  type="button"
                  onClick={() => {
                    setSelectedSep(sep);
                    setSelectedTemaId(lista[0]?._id || null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={getSeparadorCardStyle(sep)}
                  className="group text-left rounded-3xl border-2 overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
                >
                  <div className="w-full">
                    {sep.imageUrl ? (
                      <div className="h-48 w-full overflow-hidden bg-slate-950/20 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sep.imageUrl}
                          alt={sep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${sep.accentColor}33, ${sep.bgColor})`,
                        }}
                        className="h-36 w-full flex items-center justify-center border-b border-white/10"
                      >
                        <Layers
                          style={{ color: sep.accentColor }}
                          className="w-12 h-12 opacity-80 group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}

                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={{
                            backgroundColor: `${sep.accentColor}22`,
                            color: sep.accentColor,
                            borderColor: `${sep.accentColor}55`,
                          }}
                          className="text-xs font-bold px-3 py-1 rounded-full border"
                        >
                          Unidad {sep.order}
                        </span>

                        <span className="text-xs opacity-75 font-medium">
                          {lista.length} {lista.length === 1 ? "tema" : "temas"}
                        </span>
                      </div>

                      <h2 className={`font-extrabold ${sizeClasses.titleClass}`}>
                        {sep.title}
                      </h2>

                      {sep.description && (
                        <p className={`opacity-85 line-clamp-3 ${sizeClasses.bodyClass}`}>
                          {sep.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-white/10 bg-black/10 flex items-center justify-between w-full">
                    <span className="text-xs font-semibold">
                      Seleccionar y leer contenidos
                    </span>
                    <ArrowRight
                      style={{ color: sep.accentColor }}
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {/* ────────────── VISTA 2: CONTENIDOS DEL SEPARADOR SELECCIONADO ────────────── */}
        {selectedSep && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                setSelectedSep(null);
                setSelectedTemaId(null);
              }}
              className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Volver a todas las unidades / separadores
            </button>

            {/* Cabecera personalizada de la unidad seleccionada */}
            <div
              style={getSeparadorCardStyle(selectedSep)}
              className="rounded-3xl border-2 overflow-hidden shadow-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-12">
                {selectedSep.imageUrl && (
                  <div className="md:col-span-4 h-56 md:h-auto overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedSep.imageUrl}
                      alt={selectedSep.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`p-6 sm:p-8 flex flex-col justify-center space-y-3 ${
                    selectedSep.imageUrl ? "md:col-span-8" : "md:col-span-12"
                  }`}
                >
                  <div>
                    <span
                      style={{
                        backgroundColor: `${selectedSep.accentColor}22`,
                        color: selectedSep.accentColor,
                        borderColor: `${selectedSep.accentColor}55`,
                      }}
                      className="inline-block text-xs font-bold px-3 py-1 rounded-full border"
                    >
                      Unidad {selectedSep.order}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold">
                    {selectedSep.title}
                  </h2>
                  {selectedSep.description && (
                    <p className="text-sm sm:text-base opacity-90 leading-relaxed">
                      {selectedSep.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Datos / Temas generados por el admin dentro de esta división */}
            {(() => {
              const lista = temasDeSeparador(selectedSep);
              const sizeClasses = getFontSizeClasses(selectedSep.fontSize);

              if (lista.length === 0) {
                return (
                  <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-10 text-center text-sm text-slate-500">
                    El administrador aún no ha agregado temas dentro de este
                    separador.
                  </div>
                );
              }

              const activeTema =
                lista.find((t) => t._id === selectedTemaId) || lista[0];

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Índice lateral de temas de esta unidad */}
                  <aside className="lg:col-span-4 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                      Temas de esta unidad ({lista.length})
                    </h3>
                    <div className="space-y-2">
                      {lista.map((t, idx) => {
                        const isSelected = activeTema?._id === t._id;
                        return (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => setSelectedTemaId(t._id)}
                            style={
                              isSelected
                                ? {
                                    borderColor: selectedSep.accentColor,
                                    fontFamily: getFontFamilyCss(
                                      selectedSep.fontFamily
                                    ),
                                  }
                                : {
                                    fontFamily: getFontFamilyCss(
                                      selectedSep.fontFamily
                                    ),
                                  }
                            }
                            className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? "bg-white dark:bg-slate-900 border-2 shadow-sm font-bold text-slate-900 dark:text-white"
                                : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                            }`}
                          >
                            <span className="text-sm line-clamp-2">
                              {idx + 1}. {t.title}
                            </span>
                            <ArrowRight
                              style={
                                isSelected
                                  ? { color: selectedSep.accentColor }
                                  : undefined
                              }
                              className="w-4 h-4 shrink-0 opacity-70"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </aside>

                  {/* Lectura completa del tema seleccionado con el estilo del separador */}
                  {activeTema && (
                    <article
                      style={getSeparadorCardStyle(selectedSep)}
                      className="lg:col-span-8 rounded-3xl border-2 p-6 sm:p-8 shadow-md space-y-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <span
                          style={{
                            backgroundColor: `${selectedSep.accentColor}22`,
                            color: selectedSep.accentColor,
                            borderColor: `${selectedSep.accentColor}55`,
                          }}
                          className="text-xs font-bold px-3 py-1 rounded-full border"
                        >
                          {selectedSep.title}
                        </span>

                        <Link
                          href={`/wiki/${activeTema._id}`}
                          className="inline-flex items-center text-xs opacity-75 hover:opacity-100 underline"
                        >
                          Abrir en vista individual
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-extrabold">
                        {activeTema.title}
                      </h3>

                      {activeTema.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeTema.imageUrl}
                            alt={activeTema.title}
                            className="w-full h-full object-contain bg-black/20"
                          />
                        </div>
                      )}

                      <div
                        className={`whitespace-pre-wrap opacity-95 ${sizeClasses.bodyClass}`}
                      >
                        {activeTema.content}
                      </div>
                    </article>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
