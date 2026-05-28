import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/investor-dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/investor", replace: true });
  },
});