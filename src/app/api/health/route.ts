import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint para Render y monitorización de uptime.
 * Retorna status 200 rápido sin bloquear por la base de datos.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "wiki-nextjs",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    },
    { status: 200 }
  );
}
