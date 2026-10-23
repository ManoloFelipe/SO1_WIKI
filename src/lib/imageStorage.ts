import fs from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Directorio en la máquina virtual (Ubuntu Linux) o entorno local donde se almacenan
 * las imágenes subidas por el administrador.
 *
 * En Linux Ubuntu usa por defecto `<project_root>/uploads/wiki-images` (o la ruta definida
 * en `WIKI_UPLOAD_DIR`, por ejemplo `/var/wiki/uploads`), asegurando permisos POSIX 0775
 * para escritura y lectura desde el backend.
 */
const DEFAULT_LINUX_DIR = path.join(process.cwd(), "uploads", "wiki-images");
const DEFAULT_LOCAL_DIR = path.join(process.cwd(), "uploads", "wiki-images");

export function getUploadDirPath(): string {
  if (process.env.WIKI_UPLOAD_DIR && process.env.WIKI_UPLOAD_DIR.trim() !== "") {
    return path.resolve(process.env.WIKI_UPLOAD_DIR.trim());
  }
  return process.platform === "linux" ? DEFAULT_LINUX_DIR : DEFAULT_LOCAL_DIR;
}

export interface DirectoryStatus {
  directory: string;
  platform: NodeJS.Platform;
  writable: boolean;
  readable: boolean;
  modeOctal: string;
}

/**
 * Procedimiento del backend que genera la carpeta de imágenes en la máquina virtual
 * (Linux Ubuntu) y asigna explícitamente permisos de lectura y escritura:
 * - Directorio: 0o775 (rwxrwxr-x)
 * - Verifica acceso R_OK (lectura) y W_OK (escritura) para el proceso de Node.js.
 */
export async function ensureUploadDirectory(): Promise<DirectoryStatus> {
  let targetDir = getUploadDirPath();

  try {
    await fs.mkdir(targetDir, { recursive: true, mode: 0o775 });
  } catch {
    // Si la ruta personalizada (ej. /var/...) falla por permisos de root en Ubuntu,
    // usamos la carpeta dentro del espacio de trabajo del usuario en la VM.
    targetDir = DEFAULT_LINUX_DIR;
    await fs.mkdir(targetDir, { recursive: true, mode: 0o775 });
  }

  // En sistemas POSIX (Linux Ubuntu), forzamos los permisos 0775 (lectura/escritura/ejecución)
  if (process.platform !== "win32") {
    try {
      await fs.chmod(targetDir, 0o775);
    } catch {
      // Si el directorio pertenece a otro usuario del mismo grupo pero ya es accesible, continuamos
    }
  }

  // Verificamos permisos efectivos de lectura (para servir al front) y escritura (para guardar desde el front)
  await fs.access(targetDir, fsConstants.R_OK | fsConstants.W_OK);

  const stat = await fs.stat(targetDir);
  const modeOctal = (stat.mode & 0o777).toString(8).padStart(4, "0");

  return {
    directory: targetDir,
    platform: process.platform,
    writable: true,
    readable: true,
    modeOctal,
  };
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Guarda un archivo de imagen enviado desde el frontend en la carpeta de la VM
 * con permisos 0o664 (rw-rw-r--) para que pueda ser leído en futuras peticiones.
 */
export async function saveUploadedImage(file: File): Promise<{
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  directory: string;
}> {
  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) {
    throw new Error(
      "Formato de imagen no soportado. Usa PNG, JPG, WEBP, GIF o SVG."
    );
  }

  if (file.size <= 0) {
    throw new Error("El archivo de imagen está vacío.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("La imagen excede el tamaño máximo permitido de 10 MB.");
  }

  const status = await ensureUploadDirectory();

  const baseName = path
    .basename(file.name, path.extname(file.name))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 40) || "imagen";

  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const filename = `${baseName}-${uniqueSuffix}${ext}`;
  const fullPath = path.join(status.directory, filename);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Escribimos el archivo con permisos 0664 (lectura y escritura para propietario/grupo, lectura para otros)
  await fs.writeFile(fullPath, buffer, { mode: 0o664 });

  if (process.platform !== "win32") {
    try {
      await fs.chmod(fullPath, 0o664);
    } catch {
      // Ignorar si chmod no aplica
    }
  }

  return {
    filename,
    url: `/api/uploads/${encodeURIComponent(filename)}`,
    size: buffer.byteLength,
    mimeType: file.type,
    directory: status.directory,
  };
}

/**
 * Lee una imagen almacenada en la carpeta de la VM para servirla a las peticiones del frontend.
 */
export async function readUploadedImage(filename: string): Promise<{
  buffer: Buffer;
  mimeType: string;
} | null> {
  const safeName = path.basename(filename);
  if (!safeName || safeName !== filename || safeName.startsWith(".")) {
    return null;
  }

  const ext = path.extname(safeName).toLowerCase();
  const mimeType = EXT_TO_MIME[ext];
  if (!mimeType) {
    return null;
  }

  const status = await ensureUploadDirectory();
  const fullPath = path.join(status.directory, safeName);

  try {
    await fs.access(fullPath, fsConstants.R_OK);
    const buffer = await fs.readFile(fullPath);
    return { buffer, mimeType };
  } catch {
    return null;
  }
}
