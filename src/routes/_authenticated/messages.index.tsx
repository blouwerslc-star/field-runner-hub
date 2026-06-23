import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/dashboard/UiStates";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: () => (
    <div className="h-full grid place-items-center p-6">
      <EmptyState
        icon={MessageSquare}
        title="No conversation selected"
        message="Pick a conversation from the list, or start a new one to begin messaging."
        ctaLabel="Start a new message"
        ctaTo="/messages/new"
      />
    </div>
  ),
});
