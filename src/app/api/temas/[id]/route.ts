import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdmin } from "@/lib/adminAuth";
import Tema from "@/models/Tema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const noAuth = () =>
  NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
const notFound = () =>
  NextResponse.json({ success: false, error: "Tema no encontrado" }, { status: 404 });

/** GET /api/temas/:id - Un tema completo (público) */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const tema = await Tema.findById(id).lean();
    return tema ? NextResponse.json({ success: true, data: tema }) : notFound();
  } catch {
    return notFound();
  }
}

/** PUT /api/temas/:id - Edita un tema (solo admin) */
export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!isAdmin(request)) return noAuth();
  try {
    await connectToDatabase();
    const { id } = await params;
    const { title, unit, content } = await request.json();
    const tema = await Tema.findByIdAndUpdate(
      id,
      { title, unit, content },
      { new: true, runValidators: true }
    );
    return tema ? NextResponse.json({ success: true, data: tema }) : notFound();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al editar el tema";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/** DELETE /api/temas/:id - Borra un tema (solo admin) */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  if (!isAdmin(request)) return noAuth();
  try {
    await connectToDatabase();
    const { id } = await params;
    const tema = await Tema.findByIdAndDelete(id);
    return tema ? NextResponse.json({ success: true }) : notFound();
  } catch {
    return notFound();
  }
}
