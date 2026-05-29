import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!(data ?? []).some((r: any) => r.role === "admin")) {
    throw new Error("Forbidden: admin only");
  }
}

export type AdminRunner = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  service_radius: string | null;
  transportation_available: boolean | null;
  task_types: string[];
  created_at: string;
  id_file: { id: string; bucket: string; path: string; mime_type: string | null; created_at: string } | null;
};

export const listAdminRunners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ runners: AdminRunner[] }> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: roleRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "runner");
    if (rErr) throw new Error(rErr.message);
    const ids = Array.from(new Set((roleRows ?? []).map((r) => r.user_id as string)));
    if (ids.length === 0) return { runners: [] };

    const [{ data: profiles, error: pErr }, { data: files, error: fErr }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").in("user_id", ids),
      supabaseAdmin
        .from("task_files")
        .select("id, uploader_id, bucket, path, mime_type, created_at")
        .eq("bucket", "runner-ids")
        .in("uploader_id", ids)
        .order("created_at", { ascending: false }),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (fErr) throw new Error(fErr.message);

    const emailById = new Map<string, string | null>();
    await Promise.all(
      ids.map(async (id) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        emailById.set(id, data.user?.email ?? null);
      }),
    );

    const fileByUploader = new Map<string, AdminRunner["id_file"]>();
    for (const f of files ?? []) {
      if (!fileByUploader.has(f.uploader_id as string)) {
        fileByUploader.set(f.uploader_id as string, {
          id: f.id as string,
          bucket: f.bucket as string,
          path: f.path as string,
          mime_type: (f.mime_type as string | null) ?? null,
          created_at: f.created_at as string,
        });
      }
    }

    const profById = new Map<string, any>();
    for (const p of profiles ?? []) profById.set(p.user_id as string, p);

    const runners: AdminRunner[] = ids.map((id) => {
      const p = profById.get(id) ?? {};
      return {
        user_id: id,
        full_name: p.full_name ?? null,
        email: emailById.get(id) ?? null,
        phone: p.phone ?? null,
        city: p.city ?? null,
        state: p.state ?? null,
        service_radius: p.service_radius ?? null,
        transportation_available: p.transportation_available ?? null,
        task_types: p.task_types ?? [],
        created_at: p.created_at ?? new Date(0).toISOString(),
        id_file: fileByUploader.get(id) ?? null,
      };
    });
    runners.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return { runners };
  });
