"use server";

import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

type UploadFolder = "products" | "categories" | "banners";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadImageAction(
  folder: UploadFolder,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, error: "Nenhum arquivo enviado" };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Formato inválido. Use PNG, JPEG, WEBP ou GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: "Arquivo maior que 8MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000" });

  if (error) return { success: false, error: `Falha no upload: ${error.message}` };

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { success: true, data: { url: data.publicUrl } };
}

export async function deleteImageAction(publicUrl: string): Promise<ActionResult> {
  await requireAdmin();

  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return { success: false, error: "URL de imagem inválida" };
  const path = publicUrl.slice(idx + marker.length);

  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
