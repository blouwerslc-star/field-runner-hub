import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/academy/$courseSlug")({
  component: () => <Outlet />,
  head: ({ params }) => ({ meta: [{ title: `${params.courseSlug} — REI Runner Academy` }] }),
});