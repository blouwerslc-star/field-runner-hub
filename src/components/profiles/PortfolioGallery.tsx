import { useState } from "react";
import { Play, X } from "lucide-react";

export type PortfolioItem = {
  id: string;
  kind: string;
  url: string;
  thumb_url?: string | null;
  caption?: string | null;
};

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [open, setOpen] = useState<PortfolioItem | null>(null);
  if (!items?.length) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        No portfolio media yet.
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setOpen(it)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted"
          >
            <img
              src={it.thumb_url ?? it.url}
              alt={it.caption ?? ""}
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform group-hover:scale-105"
            />
            {it.kind === "video" && (
              <div className="absolute inset-0 grid place-items-center bg-black/30">
                <Play className="size-8 text-white" fill="white" />
              </div>
            )}
            {it.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                <div className="text-xs text-white line-clamp-2">{it.caption}</div>
              </div>
            )}
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white"><X className="size-5" /></button>
          {open.kind === "video" ? (
            <video src={open.url} controls autoPlay className="max-h-[90vh] max-w-[95vw] rounded-lg" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={open.url} alt={open.caption ?? ""} className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  );
}