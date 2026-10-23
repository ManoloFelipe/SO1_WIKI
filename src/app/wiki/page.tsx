"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

interface TemaResumen {
  _id: string;
  title: string;
  unit: number;
}

const UNIDADES = [1, 2, 3];

// Vista pública (solo lectura): temas agrupados por unidad.
export default function WikiPage() {
  const [temas, setTemas] = useState<TemaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/temas")
      .then((r) => r.json())
      .then((d) => (d.success ? setTemas(d.data) : setError(d.error)))
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-500" />
            Conceptos de Sistemas Operativos 1
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Temas teóricos vistos en clase, organizados por unidad.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Cargando...</p>}
        {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}

        {!loading && !error && temas.length === 0 && (
          <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Aún no hay temas publicados.
          </div>
        )}

        {UNIDADES.map((u) => {
          const lista = temas.filter((t) => t.unit === u);
          if (lista.length === 0) return null;
          return (
            <section key={u} className="space-y-3">
              <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Unidad {u}
              </h2>
              <div className="grid gap-3">
                {lista.map((t) => (
                  <Link
                    key={t._id}
                    href={`/wiki/${t._id}`}
                    className="group flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 bg-white dark:bg-slate-900/60 hover:border-emerald-500/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {t.title}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
