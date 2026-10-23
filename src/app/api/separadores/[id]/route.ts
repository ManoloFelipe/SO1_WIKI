import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdmin } from "@/lib/adminAuth";
import Separador from "@/models/Separador";
import Tema from "@/models/Tema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const noAuth = () =>
  NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
const notFound = () =>
  NextResponse.json(
    { success: false, error: "Separador no encontrado" },
    { status: 404 }
  );

/** GET /api/separadores/:id - Obtiene un separador por su ID (público) */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const separador = await Separador.findById(id).lean();
    return separador
      ? NextResponse.json({ success: true, data: separador })
      : notFound();
  } catch {
    return notFound();
  }
}

/** PUT /api/separadores/:id - Actualiza un separador y su personalización (solo admin) */
export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!isAdmin(request)) return noAuth();

  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      order,
      imageUrl,
      textColor,
      bgColor,
      accentColor,
      fontFamily,
      fontSize,
    } = body;

    const separador = await Separador.findByIdAndUpdate(
      id,
      {
        title,
        description,
        order: Number(order) || 1,
        imageUrl,
        textColor,
        bgColor,
        accentColor,
        fontFamily,
        fontSize,
      },
      { new: true, runValidators: true }
    );

    if (!separador) return notFound();

    // Sincronizamos el número de orden en los temas vinculados
    await Tema.updateMany(
      { separadorId: String(separador._id) },
      { $set: { unit: separador.order } }
    );

    return NextResponse.json({ success: true, data: separador });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al editar el separador";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/** DELETE /api/separadores/:id - Elimina un separador y sus temas asociados (solo admin) */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  if (!isAdmin(request)) return noAuth();

  try {
    await connectToDatabase();
    const { id } = await params;
    const separador = await Separador.findByIdAndDelete(id);
    if (!separador) return notFound();

    // Eliminamos también los temas pertenecientes a este separador
    await Tema.deleteMany({
      $or: [{ separadorId: id }, { separadorId: null, unit: separador.order }],
    });

    return NextResponse.json({ success: true });
  } catch {
    return notFound();
  }
}
