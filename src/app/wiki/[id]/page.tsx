"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Tema {
  _id: string;
  title: string;
  unit: number;
  content: string;
  updatedAt: string;
}

// Vista pública de un tema completo.
export default function TemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tema, setTema] = useState<Tema | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/temas/${id}`)
      .then((r) => r.json())
      .then((d) => (d.success ? setTema(d.data) : setError(d.error)))
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [id]);

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

        {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}
        {!tema && !error && <p className="text-sm text-slate-500">Cargando...</p>}

        {tema && (
          <article className="border border-slate-200 dark:border-slate-800 rounded-3xl p-8 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-4">
              Unidad {tema.unit}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {tema.title}
            </h1>
            <div className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {tema.content}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
