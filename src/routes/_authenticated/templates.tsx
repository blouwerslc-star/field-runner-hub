import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTaskTemplates, upsertTaskTemplate, deleteTaskTemplate, createTaskFromTemplate } from "@/lib/templates.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/templates")({
  component: TemplatesPage,
  head: () => ({ meta: [{ title: "Task templates — REI Runner" }] }),
});

function TemplatesPage() {
  const listFn = useServerFn(listTaskTemplates);
  const upsertFn = useServerFn(upsertTaskTemplate);
  const deleteFn = useServerFn(deleteTaskTemplate);
  const createFn = useServerFn(createTaskFromTemplate);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: () => listFn() });
  const templates = data?.templates ?? [];
  const system = templates.filter((t: any) => t.is_system);
  const mine = templates.filter((t: any) => !t.is_system);

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["templates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Task templates" subtitle="Reusable presets that let you post the same kind of task in seconds.">
      <div className="flex justify-end mb-6">
        <TemplateDialog
          trigger={<Button><Plus className="size-4 mr-2" /> New template</Button>}
          onSave={async (v) => {
            await upsertFn({ data: v });
            toast.success("Template saved");
            qc.invalidateQueries({ queryKey: ["templates"] });
          }}
        />
      </div>
      {isLoading ? <Loader2 className="size-5 animate-spin text-primary" /> : (
        <div className="space-y-8">
          <Section title="My templates">
            {mine.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground text-center">
                You haven't created any templates yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {mine.map((t: any) => (
                  <TemplateCard
                    key={t.id}
                    t={t}
                    onUse={(v) => createFn({ data: { templateId: t.id, ...v } })}
                    onSave={async (v) => {
                      await upsertFn({ data: { ...v, id: t.id } });
                      toast.success("Updated");
                      qc.invalidateQueries({ queryKey: ["templates"] });
                    }}
                    onDelete={() => del.mutate(t.id)}
                  />
                ))}
              </div>
            )}
          </Section>
          <Section title="System templates">
            <div className="grid sm:grid-cols-2 gap-3">
              {system.map((t: any) => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  onUse={(v) => createFn({ data: { templateId: t.id, ...v } })}
                />
              ))}
            </div>
          </Section>
        </div>
      )}
    </DashboardShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}

function TemplateCard({
  t,
  onUse,
  onSave,
  onDelete,
}: {
  t: any;
  onUse: (v: any) => Promise<any>;
  onSave?: (v: any) => Promise<void>;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="font-semibold truncate">{t.name}</span>
            {t.is_system && <Badge variant="outline" className="text-xs">System</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{t.task_type}</div>
        </div>
        {t.default_payout != null && <div className="text-primary font-semibold">${Number(t.default_payout).toFixed(0)}</div>}
      </div>
      {t.description && <p className="text-sm text-muted-foreground line-clamp-3">{t.description}</p>}
      <div className="flex gap-2 mt-auto pt-2">
        <UseTemplateDialog
          trigger={<Button size="sm"><Send className="size-3.5 mr-1.5" /> Post task</Button>}
          defaultPayout={t.default_payout}
          onSubmit={onUse}
        />
        {onSave && (
          <TemplateDialog
            trigger={<Button size="sm" variant="outline">Edit</Button>}
            initial={t}
            onSave={onSave}
          />
        )}
        {onDelete && (
          <Button size="sm" variant="ghost" onClick={onDelete} className="ml-auto text-destructive">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function TemplateDialog({
  trigger,
  initial,
  onSave,
}: {
  trigger: React.ReactNode;
  initial?: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [task_type, setType] = useState(initial?.task_type ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [default_payout, setPayout] = useState<string>(initial?.default_payout?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Drive-by photos" /></div>
          <div><Label>Task type</Label><Input value={task_type} onChange={(e) => setType(e.target.value)} placeholder="e.g. photos" /></div>
          <div><Label>Task title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></div>
          <div><Label>Default payout (USD)</Label><Input type="number" min="0" value={default_payout} onChange={(e) => setPayout(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !name || !task_type || !title}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({
                  name, task_type, title,
                  description: description || null,
                  default_payout: default_payout ? Number(default_payout) : null,
                });
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UseTemplateDialog({
  trigger,
  defaultPayout,
  onSubmit,
}: {
  trigger: React.ReactNode;
  defaultPayout: number | null;
  onSubmit: (v: any) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [property_address, setAddr] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip_code, setZip] = useState("");
  const [payout_amount, setPayout] = useState<string>(defaultPayout?.toString() ?? "");
  const [due_date, setDue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Post task from template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Property address</Label><Input value={property_address} onChange={(e) => setAddr(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} /></div>
            <div><Label>ZIP</Label><Input value={zip_code} onChange={(e) => setZip(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Payout (USD)</Label><Input type="number" min="0" value={payout_amount} onChange={(e) => setPayout(e.target.value)} /></div>
            <div><Label>Due date</Label><Input type="date" value={due_date} onChange={(e) => setDue(e.target.value)} /></div>
          </div>
          <div><Label>Note (optional)</Label><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !property_address || !city || !state}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({
                  property_address, city, state,
                  zip_code: zip_code || null,
                  payout_amount: payout_amount ? Number(payout_amount) : null,
                  due_date: due_date || null,
                  note: note || null,
                });
                toast.success("Task posted");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              } finally { setSaving(false); }
            }}
          >
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />} Post task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}