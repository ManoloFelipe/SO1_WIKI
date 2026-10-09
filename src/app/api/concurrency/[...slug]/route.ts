import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || "http://127.0.0.1:8000";

/**
 * Proxy transparente hacia el servidor de Python (http://127.0.0.1:8000).
 * Evita problemas de CORS y permite desplegar el frontend y el backend
 * bajo el mismo dominio o en contenedores en Azure.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const targetPath = `/api/${slug.join("/")}`;
  const targetUrl = `${PYTHON_ENGINE_URL}${targetPath}${request.nextUrl.search}`;

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        success: false,
        error: "Servidor de Python no disponible",
        detail: `No se pudo conectar a ${PYTHON_ENGINE_URL}. Asegúrate de ejecutar: py python_engine/server.py`,
        systemError: errorMessage,
      },
      { status: 503 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const targetPath = `/api/${slug.join("/")}`;
  const targetUrl = `${PYTHON_ENGINE_URL}${targetPath}`;

  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        success: false,
        error: "Servidor de Python no disponible",
        detail: `No se pudo conectar a ${PYTHON_ENGINE_URL}. Asegúrate de ejecutar: py python_engine/server.py`,
        systemError: errorMessage,
      },
      { status: 503 }
    );
  }
}
