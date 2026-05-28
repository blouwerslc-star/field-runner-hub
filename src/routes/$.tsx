import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  beforeLoad: ({ location }) => {
    const p = location.pathname;
    if (p.startsWith("/lovable/") || p.startsWith("/api/") || p === "/email/unsubscribe") return;
    throw redirect({ to: "/" });
  },
  component: () => null,
});