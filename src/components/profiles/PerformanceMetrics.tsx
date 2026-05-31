import { Progress } from "@/components/ui/progress";
import { Briefcase, Star, MessageCircle, Repeat, CheckCircle2, Clock, Activity } from "lucide-react";
import { relativeTimeFromNow } from "@/lib/profile-constants";

type Props = {
  completed_tasks_count: number;
  average_rating: number;
  review_count: number;
  response_time?: string | null;
  response_time_minutes?: number | null;
  completion_rate: number; // 0-100
  repeat_client_rate: number; // 0-100
  last_activity_at?: string | null;
};

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function PerformanceMetrics(p: Props) {
  const responseDisplay = p.response_time_minutes
    ? p.response_time_minutes < 60
      ? `${p.response_time_minutes}m`
      : `${Math.round(p.response_time_minutes / 60)}h`
    : p.response_time ?? "—";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Briefcase} label="Jobs Completed" value={p.completed_tasks_count} />
        <Stat
          icon={Star}
          label="Average Rating"
          value={p.average_rating > 0 ? p.average_rating.toFixed(1) : "—"}
          sub={`${p.review_count} review${p.review_count === 1 ? "" : "s"}`}
        />
        <Stat icon={MessageCircle} label="Response Time" value={responseDisplay} />
        <Stat icon={Activity} label="Last Active" value={relativeTimeFromNow(p.last_activity_at)} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="size-4" /> Completion Rate</span>
            <span className="font-semibold">{p.completion_rate}%</span>
          </div>
          <Progress value={p.completion_rate} className="mt-2" />
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Repeat className="size-4" /> Repeat Client Rate</span>
            <span className="font-semibold">{p.repeat_client_rate}%</span>
          </div>
          <Progress value={p.repeat_client_rate} className="mt-2" />
        </div>
      </div>
    </div>
  );
}