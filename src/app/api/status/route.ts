import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * Endpoint para comprobar el estado de conexión con MongoDB Atlas.
 * Retorna estado, latencia y detalles de la base de datos conectada.
 */
export async function GET() {
  const startTime = Date.now();
  const uriConfigured = Boolean(process.env.MONGODB_URI);

  if (!uriConfigured) {
    return NextResponse.json(
      {
        connected: false,
        error: "Variable MONGODB_URI no configurada",
        message:
          "Agrega tu cadena de conexión de MongoDB Atlas en el archivo .env.local o en las variables de entorno de Render.",
      },
      { status: 503 }
    );
  }

  try {
    const mongooseInstance = await connectToDatabase();
    const db = mongooseInstance.connection.db;

    if (!db) {
      throw new Error("No se pudo obtener la instancia de base de datos activa.");
    }

    // Ping de verificación a MongoDB
    await db.admin().ping();
    const latency = Date.now() - startTime;

    return NextResponse.json({
      connected: true,
      databaseName: mongooseInstance.connection.name,
      readyState: mongooseInstance.connection.readyState, // 1 = connected
      latencyMs: latency,
      host: mongooseInstance.connection.host,
      message: "Conexión a MongoDB Atlas establecida exitosamente.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido al conectar con MongoDB";

    return NextResponse.json(
      {
        connected: false,
        error: errorMessage,
        latencyMs: Date.now() - startTime,
        tip: "Verifica que en MongoDB Atlas hayas agregado '0.0.0.0/0' (o tu IP actual) en Network Access -> IP Access List.",
      },
      { status: 500 }
    );
  }
}
