import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicTaskDetail, applyToTask, toggleSaveTask, getMyApplicationForTask } from "@/lib/marketplace.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Loader2, MapPin, DollarSign, Calendar, BadgeCheck, Bookmark, BookmarkCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskDetailPage,
  head: () => ({ meta: [{ title: "Task — REI Runner" }] }),
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getPublicTaskDetail);
  const myAppFn = useServerFn(getMyApplicationForTask);
  const applyFn = useServerFn(applyToTask);
  const saveFn = useServerFn(toggleSaveTask);

  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["public-task", taskId],
    queryFn: () => fetchFn({ data: { taskId } }),
  });
  const { data: myApp } = useQuery({
    queryKey: ["my-application", taskId],
    queryFn: () => myAppFn({ data: { taskId } }),
    enabled: !!authed,
  });

  const [message, setMessage] = useState("");
  const apply = useMutation({
    mutationFn: () => applyFn({ data: { taskId, message: message || undefined } }),
    onSuccess: () => {
      toast.success("Application submitted");
      qc.invalidateQueries({ queryKey: ["my-application", taskId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: () => saveFn({ data: { taskId } }),
    onSuccess: (r) => {
      toast.success(r.saved ? "Saved" : "Removed");
      qc.invalidateQueries({ queryKey: ["my-application", taskId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }
  if (!data?.task) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Task not found.</div>;
  }
  const t = data.task;
  const inv = data.investor;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
          <Link to="/tasks" className="text-sm text-muted-foreground hover:text-foreground">Back to marketplace</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 grid md:grid-cols-[2fr,1fr] gap-8">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-xs font-medium">
              {t.task_type}
            </span>
            <span className="text-xs text-muted-foreground">Posted {new Date(t.created_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-2 text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-4" /> {[t.city, t.state, t.zip_code].filter(Boolean).join(", ")}
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {t.payout_amount != null && (
              <div className="rounded-xl border border-border bg-card/50 px-4 py-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Payout</div>
                <div className="text-xl font-bold text-primary flex items-center gap-1">
                  <DollarSign className="size-5" />{Number(t.payout_amount).toFixed(2)}
                </div>
              </div>
            )}
            {t.due_date && (
              <div className="rounded-xl border border-border bg-card/50 px-4 py-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Due</div>
                <div className="text-base font-semibold flex items-center gap-1">
                  <Calendar className="size-4" /> {new Date(t.due_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
          {t.description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Details</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.description}</p>
            </section>
          )}
          <p className="mt-8 text-xs text-muted-foreground">
            Exact property address is shared with the runner after assignment.
          </p>
        </div>

        <aside>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 sticky top-24 space-y-4">
            {authed === false ? (
              <>
                <p className="text-sm text-muted-foreground">Sign in as a runner to apply for this task.</p>
                <Button className="w-full" onClick={() => navigate({ to: "/login" })}>Sign in</Button>
                <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/signup" })}>Create runner account</Button>
              </>
            ) : myApp?.application ? (
              <div className="space-y-2 text-sm">
                <div className="font-semibold">Your application</div>
                <div className="text-muted-foreground">Status: <span className="font-medium text-foreground capitalize">{myApp.application.status}</span></div>
                {myApp.application.message && <p className="text-xs text-muted-foreground italic">"{myApp.application.message}"</p>}
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">Message to investor</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Why you're a great fit (optional)"
                    className="mt-1"
                  />
                </div>
                <Button className="w-full" onClick={() => apply.mutate()} disabled={apply.isPending}>
                  {apply.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Apply for this task
                </Button>
              </>
            )}
            {authed && (
              <Button variant="outline" className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
                {myApp?.saved ? <BookmarkCheck className="size-4 mr-2" /> : <Bookmark className="size-4 mr-2" />}
                {myApp?.saved ? "Saved" : "Save for later"}
              </Button>
            )}

            {inv && (
              <div className="pt-4 border-t border-border/60">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Posted by</div>
                <Link to="/profile/$slug" params={{ slug: inv.profile_slug ?? "" }} className="flex items-center gap-3 hover:opacity-80">
                  <div className="size-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold">
                    {inv.profile_photo_url ? (
                      <img src={inv.profile_photo_url} alt="" className="size-full object-cover" />
                    ) : (
                      (inv.company_name ?? inv.full_name ?? "?").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {inv.company_name ?? inv.full_name ?? "Investor"}
                      {inv.verified_status && <BadgeCheck className="size-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                      {Number(inv.average_rating ?? 0).toFixed(1)} ({inv.review_count ?? 0})
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}