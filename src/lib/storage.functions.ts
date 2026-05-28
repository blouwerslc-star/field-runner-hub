import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_BUCKETS = ["task-photos", "task-deliverables", "runner-ids", "avatars"] as const;
type Bucket = (typeof ALLOWED_BUCKETS)[number];

export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        bucket: z.enum(ALLOWED_BUCKETS),
        taskId: z.string().uuid().optional(),
        filename: z.string().min(1).max(200).regex(/^[a-zA-Z0-9._-]+$/),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let path: string;
    if (data.bucket === "task-photos" || data.bucket === "task-deliverables") {
      if (!data.taskId) throw new Error("taskId required for task buckets");
      path = `${data.taskId}/${userId}/${Date.now()}-${data.filename}`;
    } else {
      path = `${userId}/${Date.now()}-${data.filename}`;
    }
    const { data: signed, error } = await supabase.storage
      .from(data.bucket)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, bucket: data.bucket, signedUrl: signed.signedUrl, token: signed.token };
  });

export const recordTaskFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        taskId: z.string().uuid().optional().nullable(),
        submissionId: z.string().uuid().optional().nullable(),
        bucket: z.enum(ALLOWED_BUCKETS),
        path: z.string().min(1).max(500),
        mimeType: z.string().max(200).optional().nullable(),
        sizeBytes: z.number().int().nonnegative().max(2 * 1024 * 1024 * 1024).optional().nullable(),
        kind: z.enum(["photo", "video", "id", "deliverable", "other"]).default("other"),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("task_files")
      .insert({
        task_id: data.taskId ?? null,
        submission_id: data.submissionId ?? null,
        uploader_id: userId,
        bucket: data.bucket,
        path: data.path,
        mime_type: data.mimeType ?? null,
        size_bytes: data.sizeBytes ?? null,
        kind: data.kind,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { file: row };
  });

export const getSignedDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ bucket: z.enum(ALLOWED_BUCKETS), path: z.string().min(1).max(500) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: signed, error } = await supabase.storage
      .from(data.bucket)
      .createSignedUrl(data.path, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
