import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { ensureUploadDirectory, saveUploadedImage } from "@/lib/imageStorage";

export const dynamic = "force-dynamic";

/**
 * GET /api/uploads - Ejecuta el procedimiento de inicialización/verificación
 * de la carpeta de imágenes en la VM (Ubuntu Linux) y devuelve su estado y permisos.
 */
export async function GET() {
  try {
    const status = await ensureUploadDirectory();
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al preparar el directorio de imágenes en el servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/uploads - Recibe una imagen enviada por el frontend (solo admin),
 * asegura que exista la carpeta con permisos en la VM y guarda el archivo.
 */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No se envió ningún archivo de imagen válido." },
        { status: 400 }
      );
    }

    const saved = await saveUploadedImage(file);
    return NextResponse.json(
      {
        success: true,
        data: saved,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al subir la imagen";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
