import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAvailabilityBlocks,
  addAvailabilityBlock,
  removeAvailabilityBlock,
} from "@/lib/profile-extras.functions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AvailabilityBlockEditor({ runnerId }: { runnerId: string }) {
  const listFn = useServerFn(listAvailabilityBlocks);
  const addFn = useServerFn(addAvailabilityBlock);
  const delFn = useServerFn(removeAvailabilityBlock);
  const [picked, setPicked] = useState<Date | undefined>(undefined);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["availability-blocks", runnerId],
    queryFn: () => listFn({ data: { runnerId } }),
    enabled: !!runnerId,
  });

  const add = useMutation({
    mutationFn: (date: string) => addFn({ data: { date, reason: null } }),
    onSuccess: () => { toast.success("Date blocked"); void refetch(); setPicked(undefined); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: (date: string) => delFn({ data: { date } }),
    onSuccess: () => { toast.success("Date unblocked"); void refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const blocks: Array<{ id: string; blocked_date: string; reason: string | null }> =
    (data?.blocks ?? []) as any;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", !picked && "text-muted-foreground")}>
              <CalendarIcon className="size-4 mr-2" />
              {picked ? format(picked, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={picked}
              onSelect={setPicked}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          disabled={!picked || add.isPending}
          onClick={() => picked && add.mutate(toISODate(picked))}
        >
          {add.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          Block date
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : blocks.length === 0 ? (
        <div className="text-sm text-muted-foreground">No upcoming blocked dates.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {blocks.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => remove.mutate(b.blocked_date)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs hover:bg-destructive/10 hover:text-destructive transition"
              title="Click to unblock"
            >
              {format(new Date(`${b.blocked_date}T00:00:00`), "MMM d, yyyy")}
              <X className="size-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}