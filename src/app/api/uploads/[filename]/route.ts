import { NextRequest, NextResponse } from "next/server";
import { readUploadedImage } from "@/lib/imageStorage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ filename: string }> };

/**
 * GET /api/uploads/:filename - Lee la imagen desde la carpeta de la VM (Linux Ubuntu)
 * y la sirve al frontend con los encabezados MIME correspondientes.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { filename } = await params;
    const decoded = decodeURIComponent(filename);
    const result = await readUploadedImage(decoded);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Imagen no encontrada" },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(result.buffer.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al leer la imagen" },
      { status: 500 }
    );
  }
}
