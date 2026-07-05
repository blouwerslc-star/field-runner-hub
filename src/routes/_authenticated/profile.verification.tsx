import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile/verification")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/onboarding", search: { step: "identity" } });
  },
  component: () => null,
  head: () => ({ meta: [{ title: "Get Verified — REI Runner" }] }),
});
