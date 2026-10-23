"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getFontSizeClasses,
  getSeparadorCardStyle,
  type SeparadorItem,
  type TemaItem,
} from "@/lib/wikiStyles";

// Vista pública de un tema completo con el estilo personalizado de su separador.
export default function TemaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [separador, setSeparador] = useState<SeparadorItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/temas/${id}`).then((r) => r.json()),
      fetch("/api/separadores").then((r) => r.json()),
    ])
      .then(([temaRes, sepRes]) => {
        if (!temaRes.success) {
          setError(temaRes.error || "Tema no encontrado");
          return;
        }
        const loadedTema: TemaItem = temaRes.data;
        setTema(loadedTema);

        if (sepRes.success && Array.isArray(sepRes.data)) {
          const matched =
            sepRes.data.find(
              (s: SeparadorItem) => s._id === loadedTema.separadorId
            ) ||
            sepRes.data.find(
              (s: SeparadorItem) => s.order === loadedTema.unit
            );
          if (matched) setSeparador(matched);
        }
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [id]);

  const sizeClasses = getFontSizeClasses(separador?.fontSize || "base");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
        <Link
          href="/wiki"
          className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Volver a la Wiki
        </Link>

        {error && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        )}
        {!tema && !error && (
          <p className="text-sm text-slate-500">Cargando...</p>
        )}

        {tema && (
          <article
            style={separador ? getSeparadorCardStyle(separador) : undefined}
            className="border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl space-y-6"
          >
            <span
              style={
                separador
                  ? {
                      backgroundColor: `${separador.accentColor}22`,
                      color: separador.accentColor,
                      borderColor: `${separador.accentColor}55`,
                    }
                  : undefined
              }
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            >
              {separador ? separador.title : `Unidad ${tema.unit}`}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {tema.title}
            </h1>

            {tema.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tema.imageUrl}
                  alt={tema.title}
                  className="w-full h-full object-contain bg-black/20"
                />
              </div>
            )}

            <div className={`whitespace-pre-wrap ${sizeClasses.bodyClass}`}>
              {tema.content}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
