import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Abstracción de almacenamiento de archivos.
 * Local: escribe en public/uploads (dev / self-host).
 * Futuro: Vercel Blob / S3 sin cambiar callers.
 */
export interface StoredFile {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

export interface FileStorage {
  save(file: File | Buffer, opts: { filename: string; contentType: string; folder?: string }): Promise<StoredFile>;
}

export class LocalFileStorage implements FileStorage {
  constructor(private uploadDir = process.env.UPLOAD_DIR || "./public/uploads") {}

  async save(
    file: File | Buffer,
    opts: { filename: string; contentType: string; folder?: string }
  ): Promise<StoredFile> {
    const folder = opts.folder || "general";
    const ext = path.extname(opts.filename) || guessExt(opts.contentType);
    const key = `${folder}/${randomUUID()}${ext}`;
    const dir = path.join(this.uploadDir, folder);
    await mkdir(dir, { recursive: true });
    const abs = path.join(this.uploadDir, key);
    const buf = Buffer.isBuffer(file)
      ? file
      : Buffer.from(await (file as File).arrayBuffer());
    await writeFile(abs, buf);
    return {
      url: `/uploads/${key}`,
      key,
      contentType: opts.contentType,
      size: buf.length,
    };
  }
}

function guessExt(ct: string): string {
  if (ct.includes("png")) return ".png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("gltf") || ct.includes("glb")) return ".glb";
  if (ct.includes("usdz") || ct.includes("vnd.usdz")) return ".usdz";
  if (ct.includes("pdf")) return ".pdf";
  return "";
}

export function getStorage(): FileStorage {
  return new LocalFileStorage();
}
