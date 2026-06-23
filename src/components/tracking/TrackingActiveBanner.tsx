import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Navigation } from "lucide-react";
import { getMyActiveTrackingTask } from "@/lib/tracking.functions";
import { supabase } from "@/integrations/supabase/client";

export function TrackingActiveBanner() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setAuthed(!!session?.user);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const fn = useServerFn(getMyActiveTrackingTask);
  const { data } = useQuery({
    queryKey: ["my-active-tracking"],
    queryFn: () => fn(),
    enabled: authed === true,
    refetchInterval: 30_000,
  });

  if (!authed || !data?.task) return null;

  return (
    <Link
      to="/tasks/$taskId/tracking"
      params={{ taskId: data.task.id }}
      className="fixed inset-x-0 top-0 z-[55] flex items-center justify-center gap-2 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow"
    >
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
      <Navigation className="h-3.5 w-3.5" />
      Tracking active · {data.task.title} — tap to open
    </Link>
  );
}