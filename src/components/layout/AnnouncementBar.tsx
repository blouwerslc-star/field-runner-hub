import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Megaphone, X } from "lucide-react";

const STORAGE_KEY = "reirunner:announce:funding-suspended:dismissed";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="w-full border-b border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 text-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-3 text-xs sm:text-sm">
        <Megaphone className="size-4 text-primary shrink-0" aria-hidden="true" />
        <p className="flex-1 leading-snug">
          <span className="font-semibold">Work on REI Runner has been suspended due to funding.</span>{" "}
          <span className="text-muted-foreground">
            We're actively looking for investors to keep moving forward.
          </span>{" "}
          <Link
            to="/investors"
            className="underline font-medium text-primary hover:text-primary/80"
          >
            Learn how to invest
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="p-1 text-muted-foreground hover:text-foreground transition"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}