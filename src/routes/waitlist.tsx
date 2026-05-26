import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "You're on the Waitlist — REI Runner" },
      { name: "description", content: "Your application has been received. Watch your inbox for updates from REI Runner." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "You're on the Waitlist — REI Runner" },
      { property: "og:description", content: "Your application has been received. Watch your inbox for updates from REI Runner." },
    ],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-xl w-full text-center space-y-6 rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          You're on the waitlist
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Thanks for applying to REI Runner. Your application has been received and
          you've officially been added to our waitlist.
        </p>
        <div className="flex items-start gap-3 text-left bg-muted/40 border border-border rounded-lg p-4">
          <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Keep an eye on your <span className="text-foreground font-medium">email inbox</span> — and
            don't forget to check your <span className="text-foreground font-medium">spam or junk folder</span> — for
            future updates and next steps from our team.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}