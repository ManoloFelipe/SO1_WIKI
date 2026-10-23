"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, PlusCircle, Pencil, Trash2, LogOut, Save, X } from "lucide-react";
import Navbar from "@/components/Navbar";

interface TemaResumen {
  _id: string;
  title: string;
  unit: number;
}

const UNIDADES = [1, 2, 3];
const input =
  "w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500";

// Panel de administración: crear, editar y borrar temas (requiere contraseña).
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [logged, setLogged] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [temas, setTemas] = useState<TemaResumen[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState(1);
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    const d = await fetch("/api/temas").then((r) => r.json());
    if (d.success) setTemas(d.data);
  }, []);

  // Carga la lista al iniciar sesión.
  useEffect(() => {
    if (!logged) return;
    let ignore = false;
    fetch("/api/temas")
      .then((r) => r.json())
      .then((d) => {
        if (!ignore && d.success) setTemas(d.data);
      });
    return () => {
      ignore = true;
    };
  }, [logged]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
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

  function limpiar() {
    setEditId(null);
    setTitle("");
    setUnit(1);
    setContent("");
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch(editId ? `/api/temas/${editId}` : "/api/temas", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ title, unit, content }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.success) {
      setMsg(editId ? "Tema actualizado" : "Tema creado");
      limpiar();
      cargar();
    } else {
      setMsg(d.error || "Error al guardar");
    }
  }

  async function editar(id: string) {
    const d = await fetch(`/api/temas/${id}`).then((r) => r.json());
    if (d.success) {
      setEditId(id);
      setTitle(d.data.title);
      setUnit(d.data.unit);
      setContent(d.data.content);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function borrar(id: string, nombre: string) {
    if (!confirm(`¿Borrar el tema "${nombre}"?`)) return;
    const res = await fetch(`/api/temas/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    const d = await res.json();
    setMsg(d.success ? "Tema borrado" : d.error || "Error al borrar");
    cargar();
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 space-y-8">{children}</main>
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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className={input}
          required
        />
        {loginError && <p className="text-xs text-amber-600 dark:text-amber-400">{loginError}</p>}
        <button
          type="submit"
          className="w-full py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          Entrar
        </button>
      </form>
    );
  }

  return shell(
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Panel de administración</h1>
        <button
          onClick={logout}
          className="inline-flex items-center text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Salir
        </button>
      </div>

      <form
        onSubmit={guardar}
        className="border border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl space-y-4"
      >
        <h2 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
          {editId ? <Pencil className="w-4 h-4 text-emerald-500" /> : <PlusCircle className="w-4 h-4 text-emerald-500" />}
          {editId ? "Editar tema" : "Nuevo tema"}
        </h2>
        <div className="grid sm:grid-cols-[1fr_140px] gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del tema"
            className={input}
            required
          />
          <select value={unit} onChange={(e) => setUnit(Number(e.target.value))} className={input}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                Unidad {u}
              </option>
            ))}
          </select>
        </div>
        <textarea
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenido teórico (los saltos de línea se respetan)"
          className={input}
          required
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" /> {editId ? "Guardar cambios" : "Crear tema"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={limpiar}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4 mr-2" /> Cancelar
            </button>
          )}
          {msg && <span className="text-xs text-slate-500 dark:text-slate-400">{msg}</span>}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-white">Temas guardados ({temas.length})</h2>
        {temas.length === 0 && (
          <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Todavía no hay temas.
          </div>
        )}
        {temas.map((t) => (
          <div
            key={t._id}
            className="flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 bg-white dark:bg-slate-900/60"
          >
            <div className="min-w-0">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mr-2">
                U{t.unit}
              </span>
              <span className="text-sm text-slate-800 dark:text-slate-100">{t.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => editar(t._id)}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => borrar(t._id, t.title)}
                className="p-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-500"
                aria-label="Borrar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
