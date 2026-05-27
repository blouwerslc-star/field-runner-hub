import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="size-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <MapPin className="size-4 text-primary-foreground" />
            </span>
            REI <span className="text-primary">Runner</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 md:py-14">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}