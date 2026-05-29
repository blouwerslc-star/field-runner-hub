import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: () => (
    <div className="h-full grid place-items-center p-10 text-center text-muted-foreground">
      <div>
        <MessageSquare className="size-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Select a conversation or start a new one.</p>
      </div>
    </div>
  ),
});
