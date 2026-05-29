import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export function PhotoUploader({
  userId,
  label,
  currentUrl,
  onUploaded,
  shape = "circle",
}: {
  userId: string;
  label: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  shape?: "circle" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max file size is 5MB");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const safe = ext.replace(/[^a-z0-9]/g, "");
      const path = `${userId}/${Date.now()}-${label.toLowerCase()}.${safe}`;
      const { error } = await supabase.storage.from("profile-media").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const preview = (
    <div
      className={
        shape === "circle"
          ? "size-24 rounded-full bg-muted overflow-hidden border border-border flex items-center justify-center"
          : "h-32 w-full rounded-lg bg-muted overflow-hidden border border-border"
      }
      style={
        currentUrl && shape === "wide"
          ? { backgroundImage: `url(${currentUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {currentUrl && shape === "circle" && (
        <img src={currentUrl} alt={label} className="size-full object-cover" />
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {preview}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Upload className="size-3.5 mr-1.5" />}
        Upload {label}
      </Button>
    </div>
  );
}