import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { META_PIXEL_ID, GA4_MEASUREMENT_ID } from "@/lib/tracking";
import { BackButton } from "@/components/navigation/BackButton";
import { useEffect } from "react";
import { initNativeShell } from "@/lib/native";
import {
  initOneSignal,
  syncOneSignalIdentity,
  logoutOneSignalUser,
} from "@/lib/onesignal";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "NGP78xtvCvmgujpyIxbatu0zmRquvaB1lfStvuMUV64" },
      { title: "REI Runner | Real Estate Field Services Marketplace" },
      { name: "author", content: "REI Runner" },
      { property: "og:title", content: "REI Runner | Real Estate Field Services Marketplace" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "REI Runner | Real Estate Field Services Marketplace" },
      { name: "description", content: "REI Runner is a marketplace connecting real estate pros with local field runners for property tasks." },
      { property: "og:description", content: "REI Runner is a marketplace connecting real estate pros with local field runners for property tasks." },
      { name: "twitter:description", content: "REI Runner is a marketplace connecting real estate pros with local field runners for property tasks." },
      { property: "og:image", content: "https://reirunner.com/rei-runner-logo.png" },
      { name: "twitter:image", content: "https://reirunner.com/rei-runner-logo.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/rei-runner-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {META_PIXEL_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
              }}
            />
            <noscript
              dangerouslySetInnerHTML={{
                __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"/>`,
              }}
            />
          </>
        )}
        {GA4_MEASUREMENT_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_MEASUREMENT_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    initNativeShell((path) => {
      router.navigate({ to: path });
    });
    initOneSignal();
  }, [router]);

  useEffect(() => {
    // Single source of truth for auth state. Wire OneSignal identity
    // here so login/logout/refresh in any flow stays in sync, and
    // invalidate query caches so user-scoped data doesn't bleed across
    // sessions.
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    const subscribeProfile = (userId: string) => {
      if (profileChannel) return;
      try {
        profileChannel = supabase
          .channel(`onesignal-profile-${userId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
            () => {
              syncOneSignalIdentity().catch(() => {});
            },
          )
          .subscribe();
      } catch {
        // realtime may not be enabled for this table — safe to ignore
      }
    };

    const unsubscribeProfile = () => {
      if (!profileChannel) return;
      try { supabase.removeChannel(profileChannel); } catch {}
      profileChannel = null;
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      router.invalidate();
      qc.invalidateQueries();
      if (event === "SIGNED_OUT" || !session?.user) {
        // Fire and forget — OneSignal must never break auth flows.
        logoutOneSignalUser().catch(() => {});
        unsubscribeProfile();
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        syncOneSignalIdentity().catch(() => {});
        subscribeProfile(session.user.id);
      }
    });

    // Initial hydration — session may already be restored before the
    // listener attaches.
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session?.user) {
        syncOneSignalIdentity().catch(() => {});
        subscribeProfile(s.session.user.id);
      }
    });

    return () => {
      data.subscription.unsubscribe();
      unsubscribeProfile();
    };
  }, [router, qc]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <BackButton />
    </QueryClientProvider>
  );
}
