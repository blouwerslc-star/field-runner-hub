import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileDrawer } from "@/components/navigation/MobileDrawer";

export type PublicHeaderLink = {
  to: string;
  label: string;
  /** Optional icon-only collapse for mobile menu rendering (unused for now). */
  emphasis?: "muted" | "primary";
};

/**
 * Shared marketing/public header used by routes outside the authenticated shell.
 * Renders the brand + horizontal links on md+, and a hamburger that opens a
 * full-screen MobileDrawer on smaller screens. Each route passes its own link
 * set so the active-tab / contextual items stay route-specific.
 */
export function PublicHeader({
  links,
  signedIn,
  maxWidth = "max-w-7xl",
}: {
  links: PublicHeaderLink[];
  signedIn?: boolean;
  maxWidth?: "max-w-5xl" | "max-w-6xl" | "max-w-7xl";
}) {
  const [open, setOpen] = useState(false);
  const authLink: PublicHeaderLink = signedIn
    ? { to: "/dashboard", label: "Dashboard" }
    : { to: "/login", label: "Sign in" };
  const allLinks = [...links, authLink];

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className={`mx-auto ${maxWidth} px-4 sm:px-5 h-16 flex items-center justify-between gap-3`}>
          <Link to="/" aria-label="REI Runner home" className="inline-flex items-center min-w-0 shrink-0">
            <BrandLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {allLinks.map((l) => (
              <Link
                key={`${l.to}-${l.label}`}
                to={l.to}
                className="text-muted-foreground hover:text-foreground transition whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="public-header-drawer"
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex items-center justify-center size-10 -mr-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-card/60 active:scale-95 transition shrink-0"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        id="public-header-drawer"
        label="Menu"
        hiddenAt="md"
        className="sm:max-w-sm"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/60">
          <BrandLogo />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {allLinks.map((l) => (
            <Link
              key={`drawer-${l.to}-${l.label}`}
              to={l.to}
              onClick={() => setOpen(false)}
              className="w-full text-left flex items-center justify-between px-3 py-4 rounded-lg text-base text-foreground/90 hover:bg-card/60 active:bg-card transition"
            >
              <span>{l.label}</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </nav>
      </MobileDrawer>
    </>
  );
}