import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Item from "@/models/Item";

export const dynamic = "force-dynamic";

/**
 * GET /api/items - Obtiene los últimos elementos creados
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    const items = await Item.find().sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener ítems";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items - Crea un nuevo elemento en MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "El título es requerido." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "El contenido es requerido." },
        { status: 400 }
      );
    }

    const newItem = await Item.create({
      title: title.trim(),
      content: content.trim(),
      category: category ? String(category).trim() : "General",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Elemento creado exitosamente.",
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al guardar el elemento";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
