import { getStorage } from "@/lib/storage";
import { requireRoles, jsonError } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "general");
    if (!(file instanceof File)) {
      return Response.json({ error: "Archivo requerido" }, { status: 400 });
    }
    const storage = getStorage();
    const stored = await storage.save(file, {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
    });
    return Response.json(stored, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
