import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  submitFieldRunner,
  submitPro,
} from "@/lib/applications.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

const RUNNER_SERVICES = [
  "Property photos",
  "Walkthrough videos",
  "Occupancy checks",
  "Lockbox installation",
  "Yard sign placement",
  "Rehab progress photos",
  "Drive-by inspections",
  "Utility checks",
  "Contractor meetup support",
  "Other",
];

const PRO_SERVICES = [
  "Property photos",
  "Walkthrough videos",
  "Occupancy checks",
  "Lockbox installs",
  "Rehab updates",
  "Drive-by inspections",
  "Yard sign placement",
  "Other",
];

function ServicesGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (s: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((s) => {
        const active = selected.includes(s);
        return (
          <button
            type="button"
            key={s}
            onClick={() => onToggle(s)}
            className={`text-left text-sm px-3 py-2 rounded-lg border transition ${
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span className="inline-block w-4">{active ? "✓" : ""}</span>
            {s}
          </button>
        );
      })}
    </div>
  );
}

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-12 animate-fade-up">
      <div className="mx-auto mb-4 size-14 rounded-full bg-primary/15 grid place-items-center">
        <CheckCircle2 className="size-7 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Application received</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Your application has been received. We&apos;ll contact you as REI Runner
        launches in your market.
      </p>
      <Button variant="outline" className="mt-6" onClick={onReset}>
        Submit another
      </Button>
    </div>
  );
}

function FieldRunnerForm() {
  const submit = useServerFn(submitFieldRunner);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [hasTransport, setHasTransport] = useState("");
  const [hasPhone, setHasPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [reset, setReset] = useState(0);

  const toggle = (s: string) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const onReset = () => {
    setDone(false);
    setServices([]);
    setAvailability("");
    setHasTransport("");
    setHasPhone("");
    setAgreed(false);
    setReset((n) => n + 1);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      full_name: String(f.get("full_name") || ""),
      email: String(f.get("email") || ""),
      phone: String(f.get("phone") || ""),
      city: String(f.get("city") || ""),
      state: String(f.get("state") || ""),
      has_transportation: hasTransport,
      has_smartphone: hasPhone,
      services,
      availability,
      experience: String(f.get("experience") || ""),
      sample_url: String(f.get("sample_url") || ""),
      disclaimer_agreed: agreed,
      website: String(f.get("website") || ""),
    };
    if (!agreed) {
      toast.error("Please agree to the disclaimer.");
      return;
    }
    if (!services.length) {
      toast.error("Pick at least one service you can perform.");
      return;
    }
    if (!availability || !hasTransport || !hasPhone) {
      toast.error("Please complete all dropdowns.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({ data: payload as never });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please review your info and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <SuccessCard onReset={onReset} />;

  return (
    <form key={reset} onSubmit={handleSubmit} className="space-y-5">
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name"><Input name="full_name" required maxLength={100} /></Field>
        <Field label="Email Address"><Input name="email" type="email" required maxLength={200} /></Field>
        <Field label="Phone Number"><Input name="phone" required maxLength={30} /></Field>
        <Field label="City"><Input name="city" required maxLength={100} /></Field>
        <Field label="State"><Input name="state" required maxLength={50} /></Field>
        <Field label="Reliable transportation?">
          <Select value={hasTransport} onValueChange={setHasTransport}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Smartphone with quality camera?">
          <Select value={hasPhone} onValueChange={setHasPhone}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Availability">
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
            <SelectContent>
              {["Weekdays", "Weekends", "Evenings", "Same-day tasks", "Flexible"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Services you can perform">
        <ServicesGrid options={RUNNER_SERVICES} selected={services} onToggle={toggle} />
      </Field>

      <Field label="Tell us about your experience">
        <Textarea name="experience" rows={4} maxLength={2000} placeholder="Real estate, photography, gig work, etc." />
      </Field>

      <Field label="Sample photos or videos (URL)">
        <Input name="sample_url" placeholder="Link to Google Drive, Dropbox, portfolio…" maxLength={500} />
      </Field>

      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
        <span>
          I understand REI Runner only allows non-licensed support tasks. I will
          not negotiate contracts, provide pricing advice, represent buyers or
          sellers, perform inspections, or conduct licensed real estate activity.
        </span>
      </label>

      <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-primary shadow-glow">
        {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Submitting…</> : "Submit Application"}
      </Button>
    </form>
  );
}

function ProForm() {
  const submit = useServerFn(submitPro);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [frequency, setFrequency] = useState("");
  const [urgency, setUrgency] = useState("");
  const [reset, setReset] = useState(0);

  const toggle = (s: string) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const onReset = () => {
    setDone(false);
    setServices([]);
    setRole("");
    setFrequency("");
    setUrgency("");
    setReset((n) => n + 1);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!services.length) {
      toast.error("Pick at least one service you need.");
      return;
    }
    if (!role || !frequency || !urgency) {
      toast.error("Please complete all dropdowns.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          full_name: String(f.get("full_name") || ""),
          email: String(f.get("email") || ""),
          phone: String(f.get("phone") || ""),
          company_name: String(f.get("company_name") || ""),
          role,
          market_city: String(f.get("market_city") || ""),
          market_state: String(f.get("market_state") || ""),
          services_needed: services,
          frequency,
          budget: String(f.get("budget") || ""),
          urgency,
          details: String(f.get("details") || ""),
          website: String(f.get("website") || ""),
        } as never,
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please review your info and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <SuccessCard onReset={onReset} />;

  return (
    <form key={reset} onSubmit={handleSubmit} className="space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name"><Input name="full_name" required maxLength={100} /></Field>
        <Field label="Email Address"><Input name="email" type="email" required maxLength={200} /></Field>
        <Field label="Phone Number"><Input name="phone" required maxLength={30} /></Field>
        <Field label="Company Name"><Input name="company_name" maxLength={150} /></Field>
        <Field label="Role">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {["Wholesaler","Investor","Realtor","Property Manager","Landlord","Lender","Contractor","Other"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Primary Market City"><Input name="market_city" required maxLength={100} /></Field>
        <Field label="State"><Input name="market_state" required maxLength={50} /></Field>
        <Field label="Frequency">
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue placeholder="How often?" /></SelectTrigger>
            <SelectContent>
              {["One-time","Weekly","Monthly","Multiple times per month","Daily"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Average budget per task"><Input name="budget" placeholder="$" maxLength={50} /></Field>
        <Field label="Urgency">
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger><SelectValue placeholder="When do you need help?" /></SelectTrigger>
            <SelectContent>
              {["Immediately","This week","This month","Future use"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Services needed">
        <ServicesGrid options={PRO_SERVICES} selected={services} onToggle={toggle} />
      </Field>

      <Field label="Tell us what kind of help you need">
        <Textarea name="details" rows={4} maxLength={2000} placeholder="A few sentences about your typical deals…" />
      </Field>

      <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-primary shadow-glow">
        {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Submitting…</> : "Join Early Access"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function ApplicationForms({ defaultTab = "runner" }: { defaultTab?: "runner" | "pro" }) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/40">
        <TabsTrigger value="runner" className="h-10">Field Runner</TabsTrigger>
        <TabsTrigger value="pro" className="h-10">Real Estate Pro</TabsTrigger>
      </TabsList>
      <div className="mt-6 rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
        <TabsContent value="runner" className="mt-0"><FieldRunnerForm /></TabsContent>
        <TabsContent value="pro" className="mt-0"><ProForm /></TabsContent>
      </div>
    </Tabs>
  );
}