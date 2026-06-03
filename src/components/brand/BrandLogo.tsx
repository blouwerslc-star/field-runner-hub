import iconUrl from "@/assets/rei-runner-icon-clean.png";
import logoUrl from "@/assets/rei-runner-logo.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

/**
 * Inline brand mark — shows the REI Runner logo image alongside the wordmark.
 * Use in headers, footers, and auth pages.
 */
export function BrandLogo({
  className,
  showWordmark = true,
  size = "sm",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const navigate = useNavigate();
  const dims =
    size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : "h-8 w-8";

  function routeSignedInUsersHome(event: React.MouseEvent<HTMLSpanElement>) {
    if (typeof window === "undefined") return;

    const anchor = event.currentTarget.closest("a");
    if (!anchor) return;

    const target = new URL(anchor.href, window.location.origin);
    const isHomeLogoLink = target.origin === window.location.origin && target.pathname === "/";
    if (!isHomeLogoLink) return;

    event.preventDefault();
    event.stopPropagation();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/dashboard" });
        return;
      }

      if (target.hash && window.location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      navigate({ to: "/" });
    });
  }

  return (
    <span
      className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}
      onClick={routeSignedInUsersHome}
    >
      <img
        src={iconUrl}
        alt="REI Runner"
        className={cn(dims, "object-contain shrink-0")}
      />
      {showWordmark && (
        <span>
          REI <span className="text-primary">Runner</span>
        </span>
      )}
    </span>
  );
}

export { logoUrl, iconUrl };