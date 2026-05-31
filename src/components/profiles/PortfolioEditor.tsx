import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listPortfolio, addPortfolioItem, deletePortfolioItem } from "@/lib/profile-extras.functions";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Upload, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export function PortfolioEditor({ userId }: { userId: string }) {
  const listFn = useServerFn(listPortfolio);
  const addFn = useServerFn(addPortfolioItem);
  const delFn = useServerFn(deletePortfolioItem);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["portfolio", userId],
    queryFn: () => listFn({ data: { userId } }),
    enabled: !!userId,
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Removed"); void refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} is over 15MB`);
          continue;
        }
        const isVideo = file.type.startsWith("video/");
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? (isVideo ? "mp4" : "jpg");
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-portfolio")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (upErr) { toast.error(upErr.message); continue; }
        const { data: pub } = supabase.storage.from("profile-portfolio").getPublicUrl(path);
        await addFn({ data: { kind: isVideo ? "video" : "photo", url: pub.publicUrl } });
      }
      toast.success("Portfolio updated");
      await refetch();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Upload className="size-4 mr-1.5" />}
            Upload photos / videos
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          <ImagePlus className="size-6 mx-auto mb-2 opacity-50" />
          Showcase before/after photos, walkthrough videos, and completed work.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it: any) => (
            <div key={it.id} className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted group">
              {it.kind === "video" ? (
                <video src={it.url} className="size-full object-cover" />
              ) : (
                <img src={it.thumb_url ?? it.url} alt="" className="size-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => remove.mutate(it.id)}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition"
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}