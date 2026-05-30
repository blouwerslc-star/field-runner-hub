import { useRouter, useLocation } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Floating Back button rendered globally. Hidden on the home page.
 * Uses browser history when available, otherwise falls back to "/".
 */
export function BackButton() {
  const router = useRouter();
  const location = useLocation();

  if (location.pathname === "/") return null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="hidden md:inline-flex fixed bottom-4 left-4 z-50 items-center gap-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur px-3.5 py-2 text-sm font-medium text-foreground shadow-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <ArrowLeft className="size-4" />
      <span>Back</span>
    </button>
  );
}