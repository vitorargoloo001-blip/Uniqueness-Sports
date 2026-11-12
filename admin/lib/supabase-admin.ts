import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client com service_role — bypassa RLS, só usado no servidor (uploads
 * disparados por Server Actions já protegidas por requireAdmin()).
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";
