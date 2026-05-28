import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/runner-dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/runner", replace: true });
  },
});