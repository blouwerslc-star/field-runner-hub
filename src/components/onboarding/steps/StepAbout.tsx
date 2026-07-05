import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/profiles.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StepAbout({ onDone }: { onDone: () => void }) {
  const getFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => getFn() });
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    services_offered: "",
    service_radius: "",
    transportation_available: true as boolean,
  });
  useEffect(() => {
    const p = (data?.profile ?? {}) as any;
    if (p.user_id) {
      setForm({
        headline: p.headline ?? "",
        bio: p.bio ?? "",
        services_offered: (p.services_offered ?? []).join(", "),
        service_radius: p.service_radius ?? "",
        transportation_available: p.transportation_available ?? true,
      });
    }
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          headline: form.headline || null,
          bio: form.bio,
          services_offered: form.services_offered.split(",").map((s) => s.trim()).filter(Boolean),
          service_radius: form.service_radius || null,
          transportation_available: form.transportation_available,
        } as any,
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="size-4 animate-spin text-primary" />;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      <div>
        <Label className="mb-1.5 block">Headline</Label>
        <Input
          placeholder="Reliable field runner serving East TN"
          value={form.headline}
          onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Short bio</Label>
        <Textarea
          rows={4}
          maxLength={1000}
          placeholder="Tell investors what makes you dependable — background, coverage area, response times."
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Services you offer</Label>
        <Input
          placeholder="Drive-by inspection, occupancy check, lockbox install"
          value={form.services_offered}
          onChange={(e) => setForm((f) => ({ ...f, services_offered: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground mt-1">Separate with commas.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Service radius</Label>
          <Input
            placeholder="e.g. 50 miles"
            value={form.service_radius}
            onChange={(e) => setForm((f) => ({ ...f, service_radius: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            id="transport"
            type="checkbox"
            checked={form.transportation_available}
            onChange={(e) => setForm((f) => ({ ...f, transportation_available: e.target.checked }))}
          />
          <Label htmlFor="transport" className="cursor-pointer">
            I have reliable transportation
          </Label>
        </div>
      </div>
      <Button disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
        Save & continue
      </Button>
    </div>
  );
}