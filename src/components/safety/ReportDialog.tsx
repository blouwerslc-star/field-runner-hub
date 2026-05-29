import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createReport } from "@/lib/safety.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REASONS = [
  "Spam or fake content",
  "Harassment or abuse",
  "Inappropriate content",
  "Fraud or scam",
  "Off-platform solicitation",
  "Misleading information",
  "Other",
];

export function ReportDialog({
  targetType,
  targetId,
  triggerLabel = "Report",
  variant = "ghost",
}: {
  targetType: "profile" | "task" | "message" | "review";
  targetId: string;
  triggerLabel?: string;
  variant?: "ghost" | "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const fn = useServerFn(createReport);
  const m = useMutation({
    mutationFn: () => fn({ data: { target_type: targetType, target_id: targetId, reason, details: details || null } }),
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it.");
      setOpen(false);
      setDetails("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="text-xs">
          <Flag className="size-3.5 mr-1" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Additional details (optional)</label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={2000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending && <Loader2 className="size-4 mr-2 animate-spin" />} Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}