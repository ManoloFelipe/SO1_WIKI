import { timingSafeEqual } from "crypto";

// Compara la contraseña recibida con ADMIN_PASSWORD (variable de entorno).
export function checkPassword(password: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Las rutas que modifican datos exigen el encabezado x-admin-password.
export function isAdmin(request: Request): boolean {
  return checkPassword(request.headers.get("x-admin-password"));
}
