import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ATTACHMENT_BUCKET = "message-attachments";

/**
 * Redact phone numbers, email addresses, and external URLs from message
 * bodies so users cannot route conversations off-platform. Keeps reirunner
 * domains visible and replaces other contact info with [removed].
 */
function scrubContactInfo(input: string): string {
  if (!input) return input;
  let s = input;
  // Emails
  s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[contact info removed]");
  // Phone numbers — 7+ digits with optional formatting / country code
  s = s.replace(
    /(?<!\w)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\w)/g,
    "[phone removed]",
  );
  // Bare 10-digit runs
  s = s.replace(/(?<!\d)\d{10,}(?!\d)/g, "[number removed]");
  // External URLs (allow reirunner.com)
  s = s.replace(/\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi, (m) => {
    if (/(^|\.)reirunner\.com\b/i.test(m)) return m;
    return "[link removed]";
  });
  return s;
}

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: myParts, error: pErr } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);
    if (pErr) throw new Error(pErr.message);

    const convIds = (myParts ?? []).map((p) => p.conversation_id);
    if (convIds.length === 0) return { conversations: [], totalUnread: 0 };

    const lastReadMap = new Map<string, string>(
      (myParts ?? []).map((p) => [p.conversation_id, p.last_read_at as string]),
    );

    const { data: convs, error: cErr } = await supabase
      .from("conversations")
      .select("id, subject, task_id, created_by, last_message_at, last_message_preview, updated_at")
      .in("id", convIds)
      .order("last_message_at", { ascending: false });
    if (cErr) throw new Error(cErr.message);

    const { data: allParts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);

    const userIds = Array.from(new Set((allParts ?? []).map((p) => p.user_id)));
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, email, profile_photo_url, profile_slug")
          .in("user_id", userIds)
      : { data: [] as any[] };
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

    const unreadCounts = new Map<string, number>();
    for (const cid of convIds) {
      const lastRead = lastReadMap.get(cid) ?? new Date(0).toISOString();
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", cid)
        .neq("sender_id", userId)
        .gt("created_at", lastRead);
      unreadCounts.set(cid, count ?? 0);
    }

    const conversations = (convs ?? []).map((c) => {
      const participants = (allParts ?? [])
        .filter((p) => p.conversation_id === c.id)
        .map((p) => ({ user_id: p.user_id, profile: profileMap.get(p.user_id) ?? null }));
      return { ...c, participants, unread_count: unreadCounts.get(c.id) ?? 0 };
    });

    const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);
    return { conversations, totalUnread };
  });

export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);
    let total = 0;
    for (const p of parts ?? []) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", p.conversation_id)
        .neq("sender_id", userId)
        .gt("created_at", p.last_read_at as string);
      total += count ?? 0;
    }
    return { total };
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ conversationId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: conv, error: cErr } = await supabase
      .from("conversations")
      .select("id, subject, task_id, created_by, created_at, last_message_at")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!conv) throw new Error("Conversation not found");

    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("user_id, last_read_at")
      .eq("conversation_id", conv.id);

    const userIds = (parts ?? []).map((p) => p.user_id);
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, email, profile_photo_url, profile_slug")
          .in("user_id", userIds)
      : { data: [] as any[] };
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

    const { data: messages, error: mErr } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    const messageIds = (messages ?? []).map((m) => m.id);
    const { data: atts } = messageIds.length
      ? await supabase
          .from("message_attachments")
          .select("id, message_id, bucket, path, filename, mime_type, size_bytes")
          .in("message_id", messageIds)
      : { data: [] as any[] };

    const attachmentsByMessage = new Map<string, any[]>();
    for (const a of atts ?? []) {
      const { data: signed } = await supabase.storage
        .from(a.bucket)
        .createSignedUrl(a.path, 60 * 60);
      const enriched = { ...a, url: signed?.signedUrl ?? null };
      const arr = attachmentsByMessage.get(a.message_id) ?? [];
      arr.push(enriched);
      attachmentsByMessage.set(a.message_id, arr);
    }

    let task: any = null;
    if (conv.task_id) {
      const { data: t } = await supabase
        .from("tasks")
        .select("id, title, city, state, status")
        .eq("id", conv.task_id)
        .maybeSingle();
      task = t;
    }

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conv.id)
      .eq("user_id", userId);

    return {
      conversation: conv,
      task,
      currentUserId: userId,
      participants: (parts ?? []).map((p) => ({
        user_id: p.user_id,
        last_read_at: p.last_read_at,
        profile: profileMap.get(p.user_id) ?? null,
      })),
      messages: (messages ?? []).map((m) => ({
        ...m,
        sender: profileMap.get(m.sender_id) ?? null,
        attachments: attachmentsByMessage.get(m.id) ?? [],
      })),
    };
  });

export const startConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        recipientIds: z.array(z.string().uuid()).min(1).max(10),
        subject: z.string().trim().max(200).optional().nullable(),
        taskId: z.string().uuid().optional().nullable(),
        body: z.string().trim().min(1).max(5000),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const allUserIds = Array.from(new Set([userId, ...data.recipientIds]));

    const { data: conv, error: cErr } = await supabase
      .from("conversations")
      .insert({
        subject: data.subject ?? null,
        task_id: data.taskId ?? null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (cErr) throw new Error(cErr.message);

    const { error: pErr } = await supabase
      .from("conversation_participants")
      .insert(allUserIds.map((uid) => ({ conversation_id: conv.id, user_id: uid })));
    if (pErr) throw new Error(pErr.message);

    const { error: mErr } = await supabase
      .from("messages")
      .insert({ conversation_id: conv.id, sender_id: userId, body: scrubContactInfo(data.body) });
    if (mErr) throw new Error(mErr.message);

    return { conversationId: conv.id };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        body: z.string().trim().min(1).max(5000),
        attachments: z
          .array(
            z.object({
              path: z.string().min(1).max(500),
              filename: z.string().max(200).optional().nullable(),
              mime_type: z.string().max(200).optional().nullable(),
              size_bytes: z.number().int().nonnegative().optional().nullable(),
            }),
          )
          .max(10)
          .optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        sender_id: userId,
        body: scrubContactInfo(data.body),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.attachments?.length) {
      const rows = data.attachments.map((a) => ({
        message_id: msg.id,
        uploader_id: userId,
        bucket: ATTACHMENT_BUCKET,
        path: a.path,
        filename: a.filename ?? null,
        mime_type: a.mime_type ?? null,
        size_bytes: a.size_bytes ?? null,
      }));
      const { error: aErr } = await supabase.from("message_attachments").insert(rows);
      if (aErr) throw new Error(aErr.message);
    }

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversationId)
      .eq("user_id", userId);

    // Email the other participants (best-effort, non-blocking)
    try {
      const { notifyUserByEmail } = await import("./email-sender.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: parts }, { data: senderProfile }] = await Promise.all([
        supabaseAdmin
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", data.conversationId),
        supabaseAdmin.from("profiles").select("full_name").eq("user_id", userId).maybeSingle(),
      ]);
      const senderName = (senderProfile as any)?.full_name ?? "Someone";
      const recipients = (parts ?? []).map((p: any) => p.user_id).filter((u: string) => u !== userId);
      await Promise.all(
        recipients.map((uid) =>
          notifyUserByEmail({
            userId: uid,
            title: `New message from ${senderName}`,
            body: scrubContactInfo(data.body).slice(0, 200),
            link: `/messages/${data.conversationId}`,
            ctaLabel: "View message",
          }),
        ),
      );
    } catch (err) {
      console.error("message email notify failed", err);
    }

    return { messageId: msg.id };
  });

export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ conversationId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createMessageAttachmentUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        filename: z.string().min(1).max(200).regex(/^[a-zA-Z0-9._\- ]+$/),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const safe = data.filename.replace(/\s+/g, "_");
    const path = `${userId}/${Date.now()}-${safe}`;
    const { data: signed, error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, bucket: ATTACHMENT_BUCKET, signedUrl: signed.signedUrl, token: signed.token };
  });

export const listMessageableUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ search: z.string().trim().max(120).optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("profiles")
      .select("user_id, full_name, email, profile_photo_url, city, state")
      .neq("user_id", userId)
      .eq("public_profile_enabled", true)
      .eq("suspended", false)
      .limit(20);
    if (data.search && data.search.length > 0) {
      q = q.ilike("full_name", `%${data.search}%`);
    }
    const { data: profiles, error } = await q;
    if (error) throw new Error(error.message);
    return { users: profiles ?? [] };
  });
