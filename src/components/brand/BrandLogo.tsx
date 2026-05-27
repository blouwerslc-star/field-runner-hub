import iconUrl from "@/assets/rei-runner-icon-clean.png";
import logoUrl from "@/assets/rei-runner-logo.png";
import { cn } from "@/lib/utils";

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
  const dims =
    size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : "h-8 w-8";
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
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