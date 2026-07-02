import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listAvailabilitySchedule } from "@/lib/profile-extras.functions";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function normalize(t: string) { return t.length >= 5 ? t.slice(0, 5) : t; }

export function PublicAvailabilityCard({
  runnerId,
  timezone,
  notes,
  blockedDates,
}: {
  runnerId: string;
  timezone?: string | null;
  notes?: string | null;
  blockedDates?: string[];
}) {
  const fn = useServerFn(listAvailabilitySchedule);
  const { data, isLoading } = useQuery({
    queryKey: ["publicSchedule", runnerId],
    queryFn: () => fn({ data: { runnerId } }),
  });
  if (isLoading) return null;
  const windows = (data?.windows ?? []).map((w: any) => ({
    ...w,
    start_time: normalize(w.start_time),
    end_time: normalize(w.end_time),
  }));
  if (windows.length === 0) return null;

  // Compute next available slot
  const now = new Date();
  const blocked = new Set(blockedDates ?? []);
  let nextLabel: string | null = null;
  for (let i = 0; i < 14 && !nextLabel; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (blocked.has(iso)) continue;
    const wd = d.getDay();
    const wins = windows
      .filter((w: any) => w.weekday === wd)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
    for (const w of wins) {
      if (i === 0) {
        const [eh, em] = w.end_time.split(":").map(Number);
        const end = new Date(d); end.setHours(eh, em, 0, 0);
        if (end <= now) continue;
      }
      const [sh, sm] = w.start_time.split(":").map(Number);
      const startDt = new Date(d); startDt.setHours(sh, sm, 0, 0);
      const label = i === 0
        ? (startDt <= now ? "Available now" : `Today at ${fmt(w.start_time)}`)
        : i === 1
          ? `Tomorrow at ${fmt(w.start_time)}`
          : `${DAYS[wd]} at ${fmt(w.start_time)}`;
      nextLabel = label;
      break;
    }
  }

  const byDay: Record<number, typeof windows> = {};
  for (const w of windows) (byDay[w.weekday] ||= []).push(w);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {nextLabel && (
          <Badge className="inline-flex items-center gap-1.5 text-sm py-1">
            <CalendarClock className="size-3.5" /> Next available: {nextLabel}
          </Badge>
        )}
        {timezone && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> {timezone}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {DAYS.map((label, i) => {
          const wins = (byDay[i] ?? []).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
          return (
            <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-2 min-h-20">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
              {wins.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/70 italic">Off</div>
              ) : (
                <div className="space-y-1">
                  {wins.map((w: any) => (
                    <div key={w.id} className="text-[11px] rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5">
                      {fmt(w.start_time)}–{fmt(w.end_time)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {notes && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg border border-border/60 bg-card/40 p-3">
          {notes}
        </p>
      )}
    </div>
  );
}