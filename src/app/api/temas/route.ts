import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdmin } from "@/lib/adminAuth";
import Tema from "@/models/Tema";

export const dynamic = "force-dynamic";

/** GET /api/temas?unit=1 - Lista los temas (público). Sin contenido completo. */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const unit = Number(new URL(request.url).searchParams.get("unit"));
    const filter = unit ? { unit } : {};
    const data = await Tema.find(filter, "title unit updatedAt")
      .sort({ unit: 1, createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener temas";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** POST /api/temas - Crea un tema (solo admin) */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const { title, unit, content } = await request.json();
    const tema = await Tema.create({ title, unit, content });
    return NextResponse.json({ success: true, data: tema }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear el tema";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
