import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdmin } from "@/lib/adminAuth";
import Separador from "@/models/Separador";
import Tema from "@/models/Tema";

export const dynamic = "force-dynamic";

const DEFAULT_UNIT_META: Record<
  number,
  { title: string; description: string; accentColor: string }
> = {
  1: {
    title: "Unidad 1: Introducción a los Sistemas Operativos",
    description:
      "Conceptos fundamentales, evolución histórica, clasificación y llamadas al sistema.",
    accentColor: "#10b981",
  },
  2: {
    title: "Unidad 2: Procesos e Hilos",
    description:
      "Bloque de control de proceso (PCB), estados, planificación, hilos (threads) y SMP.",
    accentColor: "#06b6d4",
  },
  3: {
    title: "Unidad 3: Concurrencia e Interbloqueo",
    description:
      "Condiciones de carrera, exclusión mutua, semáforos, monitores y deadlocks.",
    accentColor: "#6366f1",
  },
};

/**
 * Si existen temas legacy (con `unit` numérico pero sin `separadorId`) y aún no hay
 * separadores creados, genera automáticamente los separadores iniciales para esas unidades
 * de modo que puedan personalizarse desde /admin y mostrarse como cards en /wiki.
 */
async function syncLegacyUnitsIfNeeded() {
  const count = await Separador.countDocuments();
  if (count > 0) return;

  const unlinkedTemas = await Tema.find({
    $or: [{ separadorId: null }, { separadorId: { $exists: false } }, { separadorId: "" }],
  }).lean();

  if (unlinkedTemas.length === 0) return;

  const distinctUnits = Array.from(
    new Set(unlinkedTemas.map((t) => Number(t.unit) || 1))
  ).sort((a, b) => a - b);

  for (const u of distinctUnits) {
    const meta = DEFAULT_UNIT_META[u] || {
      title: `Unidad ${u}`,
      description: `Contenidos teóricos correspondientes a la Unidad ${u}.`,
      accentColor: "#10b981",
    };

    const created = await Separador.create({
      title: meta.title,
      description: meta.description,
      order: u,
      imageUrl: "",
      textColor: "#f8fafc",
      bgColor: "#0f172a",
      accentColor: meta.accentColor,
      fontFamily: "sans",
      fontSize: "base",
    });

    await Tema.updateMany(
      { unit: u, $or: [{ separadorId: null }, { separadorId: { $exists: false } }, { separadorId: "" }] },
      { $set: { separadorId: String(created._id) } }
    );
  }
}

/** GET /api/separadores - Lista todos los separadores/unidades ordenados */
export async function GET() {
  try {
    await connectToDatabase();
    await syncLegacyUnitsIfNeeded();

    const data = await Separador.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener los separadores";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** POST /api/separadores - Crea un nuevo separador/unidad (solo admin) */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      title,
      description = "",
      order = 1,
      imageUrl = "",
      textColor = "#f8fafc",
      bgColor = "#0f172a",
      accentColor = "#10b981",
      fontFamily = "sans",
      fontSize = "base",
    } = body;

    const separador = await Separador.create({
      title,
      description,
      order: Number(order) || 1,
      imageUrl,
      textColor,
      bgColor,
      accentColor,
      fontFamily,
      fontSize,
    });

    return NextResponse.json({ success: true, data: separador }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al crear el separador";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
