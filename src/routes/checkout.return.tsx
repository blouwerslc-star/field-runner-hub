import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { confirmTaskFunding, confirmTaskTip } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteErrorState } from "@/components/dashboard/UiStates";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    mode: search.mode === "tip" ? ("tip" as const) : ("fund" as const),
  }),
  component: CheckoutReturn,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6">
      <RouteErrorState error={error} reset={reset} title="Payment confirmation failed" />
    </div>
  ),
  head: () => ({ meta: [{ title: "Payment complete" }] }),
});

function CheckoutReturn() {
  const { session_id, mode } = Route.useSearch();
  const navigate = useNavigate();
  const confirm = useServerFn(confirmTaskFunding);
  const confirmTip = useServerFn(confirmTaskTip);
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (!session_id) { setState("err"); setMsg("Missing session id"); return; }
    let env: "sandbox" | "live";
    try { env = getStripeEnvironment(); } catch { setState("err"); setMsg("Stripe not configured"); return; }
    const run = mode === "tip"
      ? confirmTip({ data: { sessionId: session_id, environment: env } }).then((r) => ({ ok: r.paid, error: "error" in r ? r.error : undefined }))
      : confirm({ data: { sessionId: session_id, environment: env } }).then((r) => ({ ok: r.funded, error: "error" in r ? r.error : undefined }));
    run
      .then((res) => {
        if (res.ok) {
          setState("ok");
          setTimeout(() => navigate({ to: "/dashboard/investor" }), 1500);
        } else {
          setState("err");
          setMsg(res.error ?? "Payment not completed");
        }
      })
      .catch((e: Error) => { setState("err"); setMsg(e.message); });
  }, [session_id, mode, confirm, confirmTip, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
        {state === "loading" && (<><Loader2 className="size-8 mx-auto animate-spin text-primary" /><p className="mt-4">Confirming your payment…</p></>)}
        {state === "ok" && (<><CheckCircle2 className="size-10 mx-auto text-emerald-400" /><h1 className="mt-3 text-xl font-semibold">{mode === "tip" ? "Tip sent" : "Task funded"}</h1><p className="mt-1 text-muted-foreground text-sm">Redirecting to your dashboard…</p></>)}
        {state === "err" && (<><XCircle className="size-10 mx-auto text-destructive" /><h1 className="mt-3 text-xl font-semibold">Something went wrong</h1><p className="mt-1 text-muted-foreground text-sm">{msg}</p><Button asChild className="mt-4"><Link to="/dashboard/investor">Back to dashboard</Link></Button></>)}
      </div>
    </div>
  );
}