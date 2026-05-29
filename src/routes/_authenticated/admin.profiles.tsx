import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminListProfiles, adminUpdateProfileFlags } from "@/lib/profiles.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Switch } from "@/components/ui/switch";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/profiles")({
  component: AdminProfiles,
  head: () => ({ meta: [{ title: "Admin · Profiles — REI Runner" }] }),
});

type Profile = {
  user_id: string;
  profile_slug: string | null;
  full_name: string | null;
  city: string | null;
  state: string | null;
  verified_status: boolean;
  featured: boolean;
  suspended: boolean;
  public_profile_enabled: boolean;
};

function AdminProfiles() {
  const fetchFn = useServerFn(adminListProfiles);
  const updateFn = useServerFn(adminUpdateProfileFlags);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["adminProfiles"], queryFn: () => fetchFn() });

  async function toggle(userId: string, field: "verified_status" | "featured" | "suspended" | "public_profile_enabled", value: boolean) {
    try {
      await updateFn({ data: { userId, [field]: value } });
      toast.success("Updated");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <DashboardShell title="Profiles" subtitle="Verify, feature, or suspend marketplace profiles.">
      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Location</th>
                <th className="text-center p-3">Public</th>
                <th className="text-center p-3">Verified</th>
                <th className="text-center p-3">Featured</th>
                <th className="text-center p-3">Suspended</th>
                <th className="text-right p-3">View</th>
              </tr>
            </thead>
            <tbody>
              {(data?.profiles ?? []).map((p: Profile) => (
                <tr key={p.user_id} className="border-t border-border/60">
                  <td className="p-3 font-medium">{p.full_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="p-3 text-center"><Switch checked={p.public_profile_enabled} onCheckedChange={(c) => toggle(p.user_id, "public_profile_enabled", c)} /></td>
                  <td className="p-3 text-center"><Switch checked={p.verified_status} onCheckedChange={(c) => toggle(p.user_id, "verified_status", c)} /></td>
                  <td className="p-3 text-center"><Switch checked={p.featured} onCheckedChange={(c) => toggle(p.user_id, "featured", c)} /></td>
                  <td className="p-3 text-center"><Switch checked={p.suspended} onCheckedChange={(c) => toggle(p.user_id, "suspended", c)} /></td>
                  <td className="p-3 text-right">
                    {p.profile_slug && (
                      <Link to="/profile/$slug" params={{ slug: p.profile_slug }} className="inline-flex items-center gap-1 text-primary hover:underline">
                        View <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}