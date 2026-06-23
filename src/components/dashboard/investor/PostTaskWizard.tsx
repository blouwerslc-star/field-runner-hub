import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Camera,
  Video,
  Home,
  Car,
  Key,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  MapPin,
  DollarSign,
  Calendar,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  createInvestorTask,
  defaultRequiresInteriorAccess,
} from "@/lib/tasks.functions";
import { getPricingCatalog, type PricingTemplate } from "@/lib/pricing.functions";
import { cn } from "@/lib/utils";

type TaskTypeOption = {
  value: string;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const TASK_TYPES: TaskTypeOption[] = [
  { value: "photos", label: "Exterior photos", description: "Drive-up shots of the property + street", Icon: Camera },
  { value: "video", label: "Video walkthrough", description: "Full interior video tour", Icon: Video },
  { value: "occupancy", label: "Occupancy check", description: "Confirm if property is vacant or occupied", Icon: Home },
  { value: "drive_by", label: "Drive-by", description: "Quick verify the property exists & condition", Icon: Car },
  { value: "lockbox", label: "Lockbox / sign", description: "Install lockbox or place a sign", Icon: Key },
  { value: "other", label: "Other", description: "Describe your own custom task", Icon: HelpCircle },
];

type FormState = {
  title: string;
  task_type: string;
  description: string;
  property_address: string;
  city: string;
  state: string;
  zip_code: string;
  payout_amount: string;
  due_date: string;
};

const EMPTY: FormState = {
  title: "", task_type: "photos", description: "",
  property_address: "", city: "", state: "", zip_code: "",
  payout_amount: "", due_date: "",
};

export function PostTaskWizard() {
  const qc = useQueryClient();
  const createFn = useServerFn(createInvestorTask);
  const fetchPricing = useServerFn(getPricingCatalog);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [interiorTouched, setInteriorTouched] = useState(false);
  const [requiresInterior, setRequiresInterior] = useState(false);

  const { data: pricingData } = useQuery({
    queryKey: ["pricing-catalog-investor-wizard"],
    queryFn: () => fetchPricing(),
    enabled: open,
    staleTime: 10 * 60_000,
  });

  const matchingTemplates = useMemo(() => {
    const list = (pricingData?.templates ?? []) as PricingTemplate[];
    return list.filter((t) => t.task_type === form.task_type && t.investor_price != null);
  }, [pricingData, form.task_type]);

  const priceRange = useMemo(() => {
    if (matchingTemplates.length === 0) return null;
    const prices = matchingTemplates.map((t) => Number(t.investor_price));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [matchingTemplates]);

  const autoInterior = defaultRequiresInteriorAccess(form.task_type);
  const effectiveRequiresInterior = interiorTouched ? requiresInterior : autoInterior;

  const reset = () => {
    setForm(EMPTY);
    setStep(1);
    setInteriorTouched(false);
    setRequiresInterior(false);
  };

  const create = useMutation({
    mutationFn: () => createFn({
      data: {
        title: form.title,
        task_type: form.task_type,
        property_address: form.property_address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code || null,
        payout_amount: form.payout_amount ? Number(form.payout_amount) : null,
        due_date: form.due_date || null,
        description: form.description || null,
        requires_interior_access: effectiveRequiresInterior,
      },
    }),
    onSuccess: () => {
      toast.success("Task posted. We'll start matching a local runner.");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canAdvanceStep1 = form.task_type && form.title.trim().length >= 2;
  const canAdvanceStep2 = form.property_address.trim() && form.city.trim() && form.state.trim();
  const canSubmit = canAdvanceStep1 && canAdvanceStep2;

  const selectedType = TASK_TYPES.find((t) => t.value === form.task_type);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-glow">
          <Plus className="size-4 mr-1.5" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a task</DialogTitle>
        </DialogHeader>

        <StepIndicator step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">What do you need?</Label>
              <div className="grid grid-cols-2 gap-2">
                {TASK_TYPES.map(({ value, label, description, Icon }) => {
                  const active = form.task_type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, task_type: value });
                        setInteriorTouched(false);
                      }}
                      className={cn(
                        "text-left rounded-xl border p-3 transition-all",
                        active
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                          : "border-border bg-card/40 hover:border-primary/40 hover:bg-card/70",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className={cn("size-5 mt-0.5", active ? "text-primary" : "text-muted-foreground")} />
                        <div className="min-w-0">
                          <div className="font-medium text-sm flex items-center gap-1.5">
                            {label}
                            {active && <Check className="size-3.5 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="title">Task title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={selectedType ? `${selectedType.label} at 123 Main St` : "Brief title"}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="desc">What should the runner know? (optional)</Label>
              <Textarea
                id="desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Access details, what to focus on, anything specific to capture…"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="addr" className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Property address
              </Label>
              <Input
                id="addr"
                value={form.property_address}
                onChange={(e) => setForm({ ...form, property_address: e.target.value })}
                placeholder="123 Main St"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="TX" maxLength={2} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-start gap-3">
              <Checkbox
                id="requires-interior-wizard"
                checked={effectiveRequiresInterior}
                onCheckedChange={(v) => {
                  setInteriorTouched(true);
                  setRequiresInterior(v === true);
                }}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="requires-interior-wizard" className="flex items-center gap-1.5 cursor-pointer">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Runner will enter inside the property
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {autoInterior && !interiorTouched
                    ? "Auto-enabled for this task type. Only background-check-verified runners can apply."
                    : "Check this for lockbox entry, interior walkthroughs, or any inside access."}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {priceRange && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
                <Sparkles className="size-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Suggested budget</div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    Similar {selectedType?.label.toLowerCase()} tasks typically pay{" "}
                    <span className="text-primary font-semibold">
                      ${priceRange.min.toFixed(0)}
                      {priceRange.max !== priceRange.min ? `–$${priceRange.max.toFixed(0)}` : ""}
                    </span>
                    . Higher budgets fill faster.
                  </div>
                  {priceRange.min === priceRange.max && (
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        type="button" size="sm" variant="outline"
                        onClick={() => setForm({ ...form, payout_amount: String(priceRange.min) })}
                      >
                        Use ${priceRange.min.toFixed(0)}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payout" className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5" /> Payout
                </Label>
                <Input
                  id="payout"
                  type="number"
                  min={0}
                  step="1"
                  value={form.payout_amount}
                  onChange={(e) => setForm({ ...form, payout_amount: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="due" className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Due date
                </Label>
                <Input
                  id="due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3 text-xs text-muted-foreground space-y-1">
              <div className="font-medium text-foreground text-sm">How payment works</div>
              <p>Funds go into escrow when you fund the task. On approval, your runner receives 80% and REI Runner keeps a 20% platform fee. Tips are 100% runner.</p>
            </div>

            {/* Live preview */}
            <div className="rounded-xl border border-border bg-muted/10 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preview</div>
              <div className="text-sm font-semibold">{form.title || "Untitled task"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {selectedType?.label} • {form.property_address || "—"}, {form.city || "—"}, {form.state || "—"}
              </div>
              {form.payout_amount && (
                <div className="text-xs text-primary font-semibold mt-1">
                  ${Number(form.payout_amount).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2 flex-row justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
            disabled={step === 1}
          >
            <ChevronLeft className="size-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
              disabled={(step === 1 && !canAdvanceStep1) || (step === 2 && !canAdvanceStep2)}
              className="bg-gradient-primary shadow-glow"
            >
              Next <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => create.mutate()}
              disabled={create.isPending || !canSubmit}
              className="bg-gradient-primary shadow-glow"
            >
              {create.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Post task
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["What", "Where", "Budget"];
  return (
    <div className="flex items-center gap-2 mb-2">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "size-6 rounded-full grid place-items-center text-xs font-semibold shrink-0",
                done ? "bg-primary text-primary-foreground" :
                active ? "bg-primary/20 text-primary ring-1 ring-primary" :
                "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : n}
            </div>
            <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < labels.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}