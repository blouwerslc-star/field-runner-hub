import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || cancelled) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (cancelled) return;
      const roleList = (roles ?? []).map((r) => r.role);
      if (roleList.includes("investor")) {
        navigate({ to: "/dashboard/investor", replace: true });
      } else if (roleList.includes("runner")) {
        navigate({ to: "/dashboard/runner", replace: true });
      } else {
        navigate({ to: "/dashboard/runner", replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}