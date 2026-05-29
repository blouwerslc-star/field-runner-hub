import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, Undo2 } from "lucide-react";
import {
  getMySettings,
  updateAccountSettings,
  requestAccountDeletion,
  cancelAccountDeletion,
} from "@/lib/settings.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsCard, SettingsHeader } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/account")({
  component: AccountSettings,
});

function AccountSettings() {
  const fetchSettings = useServerFn(getMySettings);
  const save = useServerFn(updateAccountSettings);
  const requestDelete = useServerFn(requestAccountDeletion);
  const cancelDelete = useServerFn(cancelAccountDeletion);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["mySettings"], queryFn: () => fetchSettings() });
  const profile = (data?.profile ?? {}) as Record<string, unknown>;
  const roles = data?.roles ?? [];
  const email = data?.auth?.email ?? "";

  const [form, setForm] = useState({ full_name: "", phone: "", city: "", state: "" });
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setForm({
        full_name: (profile.full_name as string) ?? "",
        phone: (profile.phone as string) ?? "",
        city: (profile.city as string) ?? "",
        state: (profile.state as string) ?? "",
      });
      setNewEmail(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success("Account updated");
      qc.invalidateQueries({ queryKey: ["mySettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => requestDelete(),
    onSuccess: () => {
      toast.success("Deletion requested. An admin will review.");
      qc.invalidateQueries({ queryKey: ["mySettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelDeleteMut = useMutation({
    mutationFn: () => cancelDelete(),
    onSuccess: () => {
      toast.success("Deletion request cancelled");
      qc.invalidateQueries({ queryKey: ["mySettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onChangeEmail() {
    if (!newEmail || newEmail === email) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message);
    else toast.success("Check your new email to confirm the change");
  }

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;

  const createdAt = (profile.created_at as string) ?? "";
  const status = (profile.account_status as string) ?? "active";
  const pendingDeletion = status === "pending_deletion";

  return (
    <div>
      <SettingsHeader title="Account" description="Your personal account details and status." />

      <SettingsCard
        title="Personal information"
        footer={
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Email address"
        description="A confirmation will be sent to the new address."
        footer={
          <Button variant="outline" onClick={onChangeEmail} disabled={!newEmail || newEmail === email}>
            Update email
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </div>
      </SettingsCard>

      <SettingsCard title="Role & account type">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Role</div>
            <div className="font-medium capitalize">{roles.length ? roles.join(", ") : "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Account type</div>
            <div className="font-medium">{roles.includes("admin") ? "Admin" : roles.includes("investor") ? "Investor" : roles.includes("runner") ? "Runner" : "Member"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Member since</div>
            <div className="font-medium">{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Status</div>
            <div className="font-medium capitalize">{status.replace("_", " ")}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          To change your role, contact an admin.
        </p>
      </SettingsCard>

      <SettingsCard
        title="Delete account"
        description="Request account deletion. An admin will process and confirm."
        footer={
          pendingDeletion ? (
            <Button variant="outline" onClick={() => cancelDeleteMut.mutate()} disabled={cancelDeleteMut.isPending}>
              <Undo2 className="size-3.5 mr-1.5" /> Cancel deletion request
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm("Request account deletion? This cannot be undone once processed.")) {
                  deleteMut.mutate();
                }
              }}
              disabled={deleteMut.isPending}
            >
              <Trash2 className="size-3.5 mr-1.5" /> Request deletion
            </Button>
          )
        }
      >
        {pendingDeletion ? (
          <p className="text-sm text-destructive">
            Your account is pending deletion. You can cancel this request until it's processed.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            This will flag your account for deletion. Existing tasks and payouts will be preserved
            for legal/financial reasons.
          </p>
        )}
      </SettingsCard>
    </div>
  );
}