import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { requestNewTaskType } from "@/lib/task-type-requests.functions";

export function RequestTaskTypeDialog({ trigger }: { trigger?: React.ReactNode }) {
  const qc = useQueryClient();
  const submitFn = useServerFn(requestNewTaskType);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [payout, setPayout] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      submitFn({
        data: {
          proposed_name: name.trim(),
          description: desc.trim(),
          deliverables: deliverables
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
          suggested_payout: payout ? Number(payout) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Sent to admins for review. You'll be notified when it's ready.");
      qc.invalidateQueries({ queryKey: ["my-task-type-requests"] });
      setOpen(false);
      setName(""); setDesc(""); setDeliverables(""); setPayout("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = name.trim().length >= 3 && desc.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <HelpCircle className="size-3.5 mr-1.5" /> Request a new task type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a new task type</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Describe what you need a runner to do. Our team reviews requests within 1 business day and turns approved ones into a reusable template for your account.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ttn">Task name</Label>
            <Input id="ttn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Estate sale walkthrough" />
          </div>
          <div>
            <Label htmlFor="ttd">What should the runner do?</Label>
            <Textarea id="ttd" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Step-by-step description of the task, what you need delivered, any access requirements." />
          </div>
          <div>
            <Label htmlFor="ttdel">Deliverables (one per line)</Label>
            <Textarea id="ttdel" rows={3} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="Photos of every room&#10;Written condition report&#10;Inventory list" />
          </div>
          <div>
            <Label htmlFor="ttp">Suggested payout (USD, optional)</Label>
            <Input id="ttp" value={payout} onChange={(e) => setPayout(e.target.value)} inputMode="decimal" placeholder="75" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!valid || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Send className="mr-2 size-4" /> Submit for review</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}