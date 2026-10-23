import { NextRequest, NextResponse } from "next/server";
import { checkPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/** POST /api/admin/login - Verifica la contraseña del administrador */
export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: null }));
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: "ADMIN_PASSWORD no está configurada en .env" },
      { status: 500 }
    );
  }
  if (!checkPassword(password)) {
    return NextResponse.json({ success: false, error: "Contraseña incorrecta" }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
