import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listMyAvailabilitySchedule,
  addAvailabilityWindow,
  removeAvailabilityWindow,
  clearAvailabilityDay,
  setSchedulingMeta,
} from "@/lib/profile-extras.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Loader2, Clock, CalendarClock, Info } from "lucide-react";

const DAYS = [
  { i: 0, short: "Sun", long: "Sunday" },
  { i: 1, short: "Mon", long: "Monday" },
  { i: 2, short: "Tue", long: "Tuesday" },
  { i: 3, short: "Wed", long: "Wednesday" },
  { i: 4, short: "Thu", long: "Thursday" },
  { i: 5, short: "Fri", long: "Friday" },
  { i: 6, short: "Sat", long: "Saturday" },
];

const PRESETS = [
  { label: "Morning", start: "08:00", end: "12:00" },
  { label: "Afternoon", start: "12:00", end: "17:00" },
  { label: "Evening", start: "17:00", end: "21:00" },
  { label: "All day", start: "08:00", end: "20:00" },
];

const COMMON_TZ = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
];

type Window = { id: string; weekday: number; start_time: string; end_time: string; label: string | null };

function fmt(t: string) {
  // "HH:MM" or "HH:MM:SS" → localized "8:00 AM"
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function normalizeTime(t: string) {
  // trim seconds if provided
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function WeeklyAvailabilityScheduler() {
  const listFn = useServerFn(listMyAvailabilitySchedule);
  const addFn = useServerFn(addAvailabilityWindow);
  const removeFn = useServerFn(removeAvailabilityWindow);
  const clearFn = useServerFn(clearAvailabilityDay);
  const metaFn = useServerFn(setSchedulingMeta);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["mySchedule"],
    queryFn: () => listFn(),
  });

  const windows: Window[] = useMemo(
    () =>
      (data?.windows ?? []).map((w: any) => ({
        ...w,
        start_time: normalizeTime(w.start_time),
        end_time: normalizeTime(w.end_time),
      })),
    [data],
  );

  const browserTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
  }, []);
  const [tz, setTz] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  useEffect(() => {
    if (data) {
      setTz(data.timezone || browserTz);
      setNotes(data.scheduling_notes || "");
    }
  }, [data, browserTz]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["mySchedule"] });

  const addMut = useMutation({
    mutationFn: (v: { weekday: number; start_time: string; end_time: string; label?: string | null }) =>
      addFn({ data: v }),
    onSuccess: () => { toast.success("Window added"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const clearMut = useMutation({
    mutationFn: (weekday: number) => clearFn({ data: { weekday } }),
    onSuccess: () => { toast.success("Day cleared"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const metaMut = useMutation({
    mutationFn: (v: { timezone?: string | null; scheduling_notes?: string | null }) => metaFn({ data: v }),
    onSuccess: () => { toast.success("Scheduling preferences saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function copyDay(fromDay: number, toDays: number[]) {
    const source = windows.filter((w) => w.weekday === fromDay);
    if (!source.length) { toast.error("No windows on source day to copy"); return; }
    for (const target of toDays) {
      if (target === fromDay) continue;
      // remove existing on target
      const existing = windows.filter((w) => w.weekday === target);
      for (const e of existing) {
        try { await removeFn({ data: { id: e.id } }); } catch { /* noop */ }
      }
      for (const w of source) {
        try {
          await addFn({
            data: {
              weekday: target,
              start_time: w.start_time,
              end_time: w.end_time,
              label: w.label ?? undefined,
            },
          });
        } catch { /* noop */ }
      }
    }
    invalidate();
    toast.success("Copied");
  }

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading schedule…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Meta row */}
      <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Clock className="size-3.5" /> Timezone</Label>
          <Select value={tz || browserTz} onValueChange={(v) => setTz(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {!COMMON_TZ.includes(browserTz) && (
                <SelectItem value={browserTz}>{browserTz} (browser)</SelectItem>
              )}
              {COMMON_TZ.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label className="flex items-center gap-1.5"><Info className="size-3.5" /> Scheduling note (optional)</Label>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 24h notice preferred. Same-day welcome before 3pm."
            maxLength={500}
          />
        </div>
        <div className="md:col-span-3 flex flex-wrap gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyDay(1, [2, 3, 4, 5])}
            title="Copy Monday to Tue–Fri"
          >
            <Copy className="size-3.5 mr-1.5" /> Copy Mon → weekdays
          </Button>
          <Button
            size="sm"
            onClick={() => metaMut.mutate({ timezone: tz || null, scheduling_notes: notes || null })}
            disabled={metaMut.isPending}
          >
            {metaMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save preferences
          </Button>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {DAYS.map((d) => {
          const dayWindows = windows
            .filter((w) => w.weekday === d.i)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          return (
            <div key={d.i} className="rounded-xl border border-border/60 bg-card/60 p-3 flex flex-col min-h-40">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{d.short}</div>
                  <div className="text-sm font-semibold">{d.long}</div>
                </div>
                {dayWindows.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => clearMut.mutate(d.i)}
                    title="Clear day"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                {dayWindows.length === 0 && (
                  <div className="text-xs text-muted-foreground/70 italic pt-2">No windows</div>
                )}
                {dayWindows.map((w) => (
                  <div
                    key={w.id}
                    className="group flex items-center justify-between gap-2 rounded-md bg-primary/10 border border-primary/20 px-2 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {fmt(w.start_time)} – {fmt(w.end_time)}
                      </div>
                      {w.label && <div className="text-muted-foreground truncate">{w.label}</div>}
                    </div>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                      onClick={() => removeMut.mutate(w.id)}
                      aria-label="Remove window"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <AddWindow
                weekday={d.i}
                onAdd={(v) => addMut.mutate(v)}
                pending={addMut.isPending}
                existing={dayWindows}
              />
            </div>
          );
        })}
      </div>

      {/* Preview strip */}
      <NextSevenDaysPreview windows={windows} />
    </div>
  );
}

function overlaps(a: { start_time: string; end_time: string }, b: { start_time: string; end_time: string }) {
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

function AddWindow({
  weekday,
  existing,
  onAdd,
  pending,
}: {
  weekday: number;
  existing: { start_time: string; end_time: string }[];
  onAdd: (v: { weekday: number; start_time: string; end_time: string; label?: string | null }) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [label, setLabel] = useState("");

  const invalid = end <= start;
  const conflict = existing.some((w) => overlaps(w, { start_time: start, end_time: end }));

  function commit(s: string, e: string, l?: string) {
    if (e <= s) { toast.error("End time must be after start"); return; }
    const has = existing.some((w) => overlaps(w, { start_time: s, end_time: e }));
    if (has) { toast.error("That window overlaps an existing one"); return; }
    onAdd({ weekday, start_time: s, end_time: e, label: l || null });
    setOpen(false);
    setLabel("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mt-2 justify-start text-xs h-8">
          <Plus className="size-3.5 mr-1" /> Add window
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 pointer-events-auto space-y-3">
        <div className="text-xs text-muted-foreground">Quick presets</div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => commit(p.start, p.end, p.label)}
              disabled={pending}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="border-t border-border/60 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Priority hours" maxLength={60} />
          </div>
          {(invalid || conflict) && (
            <div className="text-xs text-destructive">
              {invalid ? "End must be after start." : "Overlaps an existing window."}
            </div>
          )}
          <Button
            size="sm"
            className="w-full"
            disabled={invalid || conflict || pending}
            onClick={() => commit(start, end, label)}
          >
            {pending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Add window
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NextSevenDaysPreview({ windows }: { windows: Window[] }) {
  const days = useMemo(() => {
    const out: { date: Date; wd: number; wins: Window[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const wd = d.getDay();
      out.push({ date: d, wd, wins: windows.filter((w) => w.weekday === wd) });
    }
    return out;
  }, [windows]);

  const hasAny = days.some((d) => d.wins.length > 0);
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-3">
        <CalendarClock className="size-3.5" /> Next 7 days — investor preview
      </div>
      {!hasAny && (
        <div className="text-sm text-muted-foreground">
          Add at least one window above to start appearing in investor availability searches.
        </div>
      )}
      {hasAny && (
        <div className="grid grid-cols-7 gap-2">
          {days.map(({ date, wins }, idx) => (
            <div key={idx} className="rounded-lg border border-border/60 bg-background p-2 min-h-24">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {date.toLocaleDateString([], { weekday: "short" })}
              </div>
              <div className="text-sm font-semibold">{date.getDate()}</div>
              <div className="mt-1 space-y-1">
                {wins.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground/70">Off</div>
                ) : (
                  wins.slice(0, 3).map((w) => (
                    <Badge key={w.id} variant="secondary" className="text-[10px] px-1.5 py-0 block truncate">
                      {fmt(w.start_time)}
                    </Badge>
                  ))
                )}
                {wins.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{wins.length - 3} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}