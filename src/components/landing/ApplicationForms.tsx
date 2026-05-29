import { useState, useId, cloneElement, isValidElement } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

async function createAccount(opts: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: "runner" | "investor";
}): Promise<{ hasSession: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: opts.email,
    password: opts.password,
    options: {
      emailRedirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : undefined,
      data: {
        role: opts.role,
        full_name: opts.full_name,
        phone: opts.phone,
      },
    },
  });
  if (error) {
    const msg = error.message || "";
    if (/registered|exists/i.test(msg)) {
      throw new Error(
        "An account with that email already exists. Please sign in instead.",
      );
    }
    throw new Error(msg || "Could not create your account.");
  }
  return { hasSession: !!data.session };
}

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
      <h2 className="text-xl font-semibold mb-2">Application received</h2>
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

export function FieldRunnerForm() {
  const submit = useServerFn(submitFieldRunner);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [hasTransport, setHasTransport] = useState("");
  const [hasPhone, setHasPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [hasLicense, setHasLicense] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [travelRadius, setTravelRadius] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [payout, setPayout] = useState("");
  const [heardAbout, setHeardAbout] = useState("");
  const [bgConsent, setBgConsent] = useState(false);
  const [reset, setReset] = useState(0);

  const toggle = (s: string) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const onReset = () => {
    setDone(false);
    setStep(0);
    setServices([]);
    setAvailability("");
    setHasTransport("");
    setHasPhone("");
    setAgreed(false);
    setHasLicense("");
    setVehicleType("");
    setTravelRadius("");
    setHoursPerWeek("");
    setPayout("");
    setHeardAbout("");
    setBgConsent(false);
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
      street_address: String(f.get("street_address") || ""),
      zip_code: String(f.get("zip_code") || ""),
      date_of_birth: String(f.get("date_of_birth") || ""),
      has_transportation: hasTransport,
      has_drivers_license: hasLicense,
      vehicle_type: vehicleType,
      travel_radius_miles: travelRadius,
      has_smartphone: hasPhone,
      services,
      availability,
      hours_per_week: hoursPerWeek,
      preferred_payout: payout,
      background_check_consent: bgConsent,
      heard_about: heardAbout,
      referral_code: String(f.get("referral_code") || ""),
      social_links: String(f.get("social_links") || ""),
      experience: String(f.get("experience") || ""),
      sample_url: String(f.get("sample_url") || ""),
      disclaimer_agreed: agreed,
      website: String(f.get("website") || ""),
    };
    if (!agreed) {
      toast.error("Please agree to the disclaimer.");
      return;
    }
    if (!bgConsent) {
      toast.error("Please consent to a background check to continue.");
      return;
    }
    if (!services.length) {
      toast.error("Pick at least one service you can perform.");
      return;
    }
    if (
      !availability || !hasTransport || !hasPhone || !hasLicense ||
      !vehicleType || !travelRadius || !hoursPerWeek || !payout || !heardAbout
    ) {
      toast.error("Please complete all dropdowns.");
      return;
    }
    if (password.length < 8) {
      toast.error("Please choose a password of at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const { hasSession } = await createAccount({
        email: payload.email,
        password,
        full_name: payload.full_name,
        phone: payload.phone,
        role: "runner",
      });
      await submit({ data: payload as never });
      setDone(true);
      if (hasSession) {
        toast.success("Application submitted. Welcome aboard!");
        navigate({ to: "/dashboard/runner" });
      } else {
        toast.success("Application received. Check your email to verify your account.");
        navigate({ to: "/login", search: { redirect: "/dashboard/runner" } });
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Submission failed. Please review your info and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <SuccessCard onReset={onReset} />;

  const STEPS = ["About you", "Logistics", "Work prefs", "Experience"];
  const progressPct = ((step + 1) / STEPS.length) * 100;

  function validateStep(): string | null {
    if (step === 0) {
      const form = document.querySelector<HTMLFormElement>("form[data-runner-form]");
      if (!form) return null;
      const required = ["full_name", "email", "phone", "date_of_birth", "street_address", "city", "state", "zip_code"];
      for (const name of required) {
        const el = form.elements.namedItem(name) as HTMLInputElement | null;
        if (!el || !el.value.trim()) return "Please complete all fields in this step.";
      }
      if (password.length < 8) return "Please choose a password of at least 8 characters.";
    }
    if (step === 1) {
      if (!hasTransport || !hasLicense || !vehicleType || !travelRadius || !hasPhone)
        return "Please complete all logistics questions.";
    }
    if (step === 2) {
      if (!availability || !hoursPerWeek || !payout || !heardAbout)
        return "Please complete all work preference questions.";
      if (!services.length) return "Pick at least one service you can perform.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form key={reset} data-runner-form onSubmit={handleSubmit} className="space-y-6">
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-muted-foreground">{STEPS[step]}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="hidden sm:flex items-center justify-between gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 text-center text-[11px] uppercase tracking-wider transition ${
                i <= step ? "text-primary font-semibold" : "text-muted-foreground/60"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: About you */}
      <div className={step === 0 ? "grid sm:grid-cols-2 gap-4 animate-fade-up" : "hidden"}>
        <Field label="Full Name"><Input name="full_name" required maxLength={100} /></Field>
        <Field label="Email Address"><Input name="email" type="email" required maxLength={200} /></Field>
        <Field label="Phone Number"><Input name="phone" required maxLength={30} /></Field>
        <Field label="Date of Birth"><Input name="date_of_birth" type="date" required /></Field>
        <Field label="Street Address"><Input name="street_address" required maxLength={200} /></Field>
        <Field label="City"><Input name="city" required maxLength={100} /></Field>
        <Field label="State"><Input name="state" required maxLength={50} /></Field>
        <Field label="Zip Code"><Input name="zip_code" required maxLength={20} /></Field>
        <Field label="Choose a password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={100}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </Field>
      </div>

      {/* Step 2: Logistics */}
      <div className={step === 1 ? "grid sm:grid-cols-2 gap-4 animate-fade-up" : "hidden"}>
        <Field label="Reliable transportation?">
          <Select value={hasTransport} onValueChange={setHasTransport}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Valid driver's license?">
          <Select value={hasLicense} onValueChange={setHasLicense}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Vehicle type">
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
            <SelectContent>
              {["Car","SUV","Truck","Van","Motorcycle","Bicycle","None"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Willing to travel">
          <Select value={travelRadius} onValueChange={setTravelRadius}>
            <SelectTrigger><SelectValue placeholder="Travel radius" /></SelectTrigger>
            <SelectContent>
              {["Up to 10 miles","Up to 25 miles","Up to 50 miles","50+ miles"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
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
      </div>

      {/* Step 3: Work preferences */}
      <div className={step === 2 ? "space-y-5 animate-fade-up" : "hidden"}>
      <div className="grid sm:grid-cols-2 gap-4">
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
        <Field label="Hours per week">
          <Select value={hoursPerWeek} onValueChange={setHoursPerWeek}>
            <SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger>
            <SelectContent>
              {["Under 5","5–10","10–20","20–40","40+"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Preferred payout method">
          <Select value={payout} onValueChange={setPayout}>
            <SelectTrigger><SelectValue placeholder="How do you want to be paid?" /></SelectTrigger>
            <SelectContent>
              {["Direct Deposit","PayPal","Venmo","Cash App","Zelle","Check"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="How did you hear about us?">
          <Select value={heardAbout} onValueChange={setHeardAbout}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["Google search","Facebook","Instagram","TikTok","YouTube","Friend / Referral","Real estate group","Other"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
        <Field label="Services you can perform">
          <ServicesGrid options={RUNNER_SERVICES} selected={services} onToggle={toggle} />
        </Field>
      </div>

      {/* Step 4: Experience & consent */}
      <div className={step === 3 ? "space-y-5 animate-fade-up" : "hidden"}>
      <Field label="Tell us about your experience">
        <Textarea name="experience" rows={4} maxLength={2000} placeholder="Real estate, photography, gig work, etc." />
      </Field>

      <Field label="Sample photos or videos (URL)">
        <Input name="sample_url" placeholder="Link to Google Drive, Dropbox, portfolio…" maxLength={500} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Referral code (optional)">
          <Input name="referral_code" placeholder="Who sent you?" maxLength={50} />
        </Field>
        <Field label="Social profile link (optional)">
          <Input name="social_links" placeholder="LinkedIn, Instagram, etc." maxLength={500} />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox checked={bgConsent} onCheckedChange={(v) => setBgConsent(v === true)} className="mt-0.5" />
        <span>
          I consent to a basic background check if selected for the REI Runner field
          runner network.
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
        <span>
          I understand REI Runner only allows non-licensed support tasks. I will
          not negotiate contracts, provide pricing advice, represent buyers or
          sellers, perform inspections, or conduct licensed real estate activity.
        </span>
      </label>
      </div>

      {/* Sticky nav */}
      <div className="sticky bottom-0 -mx-6 md:-mx-8 px-6 md:px-8 pt-4 pb-4 bg-gradient-to-t from-card via-card/95 to-transparent border-t border-border/40 flex items-center gap-3">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="h-12"
          >
            <ChevronLeft className="size-4 mr-1" /> Back
          </Button>
        ) : (
          <div className="text-xs text-muted-foreground hidden sm:block">
            Takes ~3 minutes
          </div>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            size="lg"
            onClick={goNext}
            className="h-12 min-w-[140px] bg-gradient-primary shadow-glow"
          >
            Continue <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="h-12 min-w-[180px] bg-gradient-primary shadow-glow"
          >
            {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Submitting…</> : "Submit Application"}
          </Button>
        )}
      </div>
    </form>
  );
}

export function ProForm() {
  const submit = useServerFn(submitPro);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [frequency, setFrequency] = useState("");
  const [urgency, setUrgency] = useState("");
  const [password, setPassword] = useState("");
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
    if (password.length < 8) {
      toast.error("Please choose a password of at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const email = String(f.get("email") || "");
      const fullName = String(f.get("full_name") || "");
      const phone = String(f.get("phone") || "");
      const { hasSession } = await createAccount({
        email,
        password,
        full_name: fullName,
        phone,
        role: "investor",
      });
      await submit({
        data: {
          full_name: fullName,
          email,
          phone,
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
      if (hasSession) {
        toast.success("Application submitted. Welcome aboard!");
        navigate({ to: "/dashboard/investor" });
      } else {
        toast.success("Application received. Check your email to verify your account.");
        navigate({ to: "/login", search: { redirect: "/dashboard/investor" } });
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Submission failed. Please review your info and try again.");
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
  const id = useId();
  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ id?: string }>, { id })
    : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-muted-foreground">{label}</Label>
      {child}
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