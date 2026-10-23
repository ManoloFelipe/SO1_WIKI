import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdmin } from "@/lib/adminAuth";
import Tema from "@/models/Tema";
import Separador from "@/models/Separador";

export const dynamic = "force-dynamic";

/** GET /api/temas?unit=1&separadorId=... - Lista los temas (público). */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const unit = Number(searchParams.get("unit"));
    const separadorId = searchParams.get("separadorId");

    const filter: Record<string, unknown> = {};
    if (separadorId) {
      filter.separadorId = separadorId;
    } else if (unit) {
      filter.unit = unit;
    }

    const data = await Tema.find(
      filter,
      "title unit separadorId content imageUrl updatedAt"
    )
      .sort({ unit: 1, createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener temas";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** POST /api/temas - Crea un tema dentro de un separador (solo admin) */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    );
  }
  try {
    await connectToDatabase();
    const { title, unit, separadorId, content, imageUrl = "" } = await request.json();

    let resolvedUnit = Number(unit) || 1;
    if (separadorId) {
      const sep = await Separador.findById(separadorId).lean();
      if (sep) {
        resolvedUnit = sep.order;
      }
    }

    const tema = await Tema.create({
      title,
      unit: resolvedUnit,
      separadorId: separadorId || null,
      content,
      imageUrl,
    });
    return NextResponse.json({ success: true, data: tema }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al crear el tema";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
