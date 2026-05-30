import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/academy")({
  component: () => <Outlet />,
  head: () => ({ meta: [{ title: "REI Runner Academy" }] }),
});