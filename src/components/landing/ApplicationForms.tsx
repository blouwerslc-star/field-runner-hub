import { useState, useId, cloneElement, isValidElement } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";

type RunnerMeta = {
  city: string;
  state: string;
  service_radius: string;
  transportation_available: boolean;
  task_types: string[];
};

type InvestorMeta = {
  company_name: string;
  markets_served: string;
  monthly_deal_volume: string;
};

function mapAuthError(code: string | undefined, message: string): string {
  switch (code) {
    case "weak_password":
      return "That password is too weak or has appeared in a known data breach. Please choose a stronger, unique password (mix letters, numbers, and symbols — and don't reuse a password from another site).";
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Please sign in instead.";
    case "signup_disabled":
      return "New account sign-ups are temporarily disabled. Please try again later.";
    case "validation_failed":
    case "invalid_email":
      return "That email address looks invalid. Please double-check and try again.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    default:
      if (/registered|already.*exists/i.test(message)) {
        return "An account with that email already exists. Please sign in instead.";
      }
      if (/password/i.test(message) && /weak|pwned|breach/i.test(message)) {
        return "That password is too weak or has appeared in a known data breach. Please choose a stronger, unique password.";
      }
      return message || "Could not create your account. Please try again.";
  }
}

async function createAccount(opts: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: "runner" | "investor";
  extra: RunnerMeta | InvestorMeta;
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
        ...opts.extra,
      },
    },
  });
  if (error) {
    throw new Error(mapAuthError((error as { code?: string }).code, error.message));
  }
  if (!data.user) {
    throw new Error("Sign-up didn't return a user. Please try again.");
  }
  return { hasSession: !!data.session };
}

const RUNNER_TASK_TYPES = [
  "Property Photos",
  "Walkthrough Videos",
  "Occupancy Checks",
  "Lockbox Installs",
  "Showing Assistance",
  "Property Condition Reports",
  "Vacant Property Verification",
  "Document Delivery",
];

const SERVICE_RADIUS_OPTIONS = [
  "Up to 10 miles",
  "Up to 25 miles",
  "Up to 50 miles",
  "50+ miles",
];

const DEAL_VOLUME_OPTIONS = [
  "1–3 deals / month",
  "4–10 deals / month",
  "11–25 deals / month",
  "25+ deals / month",
];

function TaskTypesGrid({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (s: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {RUNNER_TASK_TYPES.map((s) => {
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

function SuccessCard({
  onReset,
  needsEmailVerification,
  email,
}: {
  onReset: () => void;
  needsEmailVerification: boolean;
  email: string;
}) {
  return (
    <div className="text-center py-12 animate-fade-up">
      <div className="mx-auto mb-4 size-14 rounded-full bg-primary/15 grid place-items-center">
        {needsEmailVerification ? (
          <MailCheck className="size-7 text-primary" />
        ) : (
          <CheckCircle2 className="size-7 text-primary" />
        )}
      </div>
      <h2 className="text-xl font-semibold mb-2">
        {needsEmailVerification ? "Verify your email" : "Account created"}
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        {needsEmailVerification ? (
          <>
            We sent a confirmation link to <strong>{email}</strong>. Click it
            to activate your account, then sign in.
          </>
        ) : (
          <>Your account is set up. Redirecting you to your dashboard…</>
        )}
      </p>
      <Button variant="outline" className="mt-6" onClick={onReset}>
        Start over
      </Button>
    </div>
  );
}

export function FieldRunnerForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [serviceRadius, setServiceRadius] = useState("");
  const [transportation, setTransportation] = useState("");
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [reset, setReset] = useState(0);

  const toggle = (s: string) =>
    setTaskTypes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const onReset = () => {
    setDone(false);
    setNeedsEmailVerification(false);
    setSubmittedEmail("");
    setFormError(null);
    setServiceRadius("");
    setTransportation("");
    setTaskTypes([]);
    setPassword("");
    setReset((n) => n + 1);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const f = new FormData(e.currentTarget);
    const full_name = String(f.get("full_name") || "").trim();
    const email = String(f.get("email") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    const city = String(f.get("city") || "").trim();
    const state = String(f.get("state") || "").trim();

    if (!full_name || !email || !phone || !city || !state) {
      toast.error("Please complete all required fields.");
      return;
    }
    if (!serviceRadius || !transportation) {
      toast.error("Please complete service radius and transportation.");
      return;
    }
    if (taskTypes.length === 0) {
      toast.error("Pick at least one task type you can perform.");
      return;
    }
    if (password.length < 8) {
      toast.error("Please choose a password of at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { hasSession } = await createAccount({
        email,
        password,
        full_name,
        phone,
        role: "runner",
        extra: {
          city,
          state,
          service_radius: serviceRadius,
          transportation_available: transportation === "yes",
          task_types: taskTypes,
        },
      });
      setSubmittedEmail(email);
      setNeedsEmailVerification(!hasSession);
      setDone(true);
      if (hasSession) {
        toast.success("Welcome aboard!");
        navigate({ to: "/dashboard/runner" });
      } else {
        toast.success("Account created — check your email to verify.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      console.error("[signup:runner]", err);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done)
    return (
      <SuccessCard
        onReset={onReset}
        needsEmailVerification={needsEmailVerification}
        email={submittedEmail}
      />
    );

  return (
    <form key={reset} onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Sign-up failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name"><Input name="full_name" required maxLength={100} /></Field>
        <Field label="Email"><Input name="email" type="email" required maxLength={200} /></Field>
        <Field label="Phone"><Input name="phone" required maxLength={30} /></Field>
        <Field label="City"><Input name="city" required maxLength={100} /></Field>
        <Field label="State"><Input name="state" required maxLength={50} /></Field>
        <Field label="Service Radius">
          <Select value={serviceRadius} onValueChange={setServiceRadius}>
            <SelectTrigger><SelectValue placeholder="Select radius" /></SelectTrigger>
            <SelectContent>
              {SERVICE_RADIUS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Transportation Available">
          <Select value={transportation} onValueChange={setTransportation}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Task Types (select all you can perform)">
        <TaskTypesGrid selected={taskTypes} onToggle={toggle} />
      </Field>

      <Field label="Choose a password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          autoComplete="new-password"
          placeholder="At least 8 characters — this creates your account"
        />
      </Field>

      <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-primary shadow-glow">
        {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Creating account…</> : "Create Runner Account"}
      </Button>
    </form>
  );
}

export function ProForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [dealVolume, setDealVolume] = useState("");
  const [password, setPassword] = useState("");
  const [reset, setReset] = useState(0);

  const onReset = () => {
    setDone(false);
    setNeedsEmailVerification(false);
    setSubmittedEmail("");
    setFormError(null);
    setDealVolume("");
    setPassword("");
    setReset((n) => n + 1);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const f = new FormData(e.currentTarget);
    const full_name = String(f.get("full_name") || "").trim();
    const email = String(f.get("email") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    const company_name = String(f.get("company_name") || "").trim();
    const markets_served = String(f.get("markets_served") || "").trim();

    if (!full_name || !email || !phone || !markets_served) {
      toast.error("Please complete all required fields.");
      return;
    }
    if (!dealVolume) {
      toast.error("Please select your monthly deal volume.");
      return;
    }
    if (password.length < 8) {
      toast.error("Please choose a password of at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { hasSession } = await createAccount({
        email,
        password,
        full_name,
        phone,
        role: "investor",
        extra: {
          company_name,
          markets_served,
          monthly_deal_volume: dealVolume,
        },
      });
      setSubmittedEmail(email);
      setNeedsEmailVerification(!hasSession);
      setDone(true);
      if (hasSession) {
        toast.success("Welcome aboard!");
        navigate({ to: "/dashboard/investor" });
      } else {
        toast.success("Account created — check your email to verify.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      console.error("[signup:investor]", err);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done)
    return (
      <SuccessCard
        onReset={onReset}
        needsEmailVerification={needsEmailVerification}
        email={submittedEmail}
      />
    );

  return (
    <form key={reset} onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Sign-up failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name"><Input name="full_name" required maxLength={100} /></Field>
        <Field label="Email"><Input name="email" type="email" required maxLength={200} /></Field>
        <Field label="Phone"><Input name="phone" required maxLength={30} /></Field>
        <Field label="Company Name"><Input name="company_name" maxLength={150} /></Field>
        <Field label="Markets Served">
          <Input name="markets_served" required maxLength={300} placeholder="e.g. Atlanta GA, Charlotte NC" />
        </Field>
        <Field label="Monthly Deal Volume">
          <Select value={dealVolume} onValueChange={setDealVolume}>
            <SelectTrigger><SelectValue placeholder="Select volume" /></SelectTrigger>
            <SelectContent>
              {DEAL_VOLUME_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Choose a password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          autoComplete="new-password"
          placeholder="At least 8 characters — this creates your account"
        />
      </Field>

      <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-primary shadow-glow">
        {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Creating account…</> : "Create Investor Account"}
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
        <TabsTrigger value="pro" className="h-10">Investor</TabsTrigger>
      </TabsList>
      <div className="mt-6 rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
        <TabsContent value="runner" className="mt-0"><FieldRunnerForm /></TabsContent>
        <TabsContent value="pro" className="mt-0"><ProForm /></TabsContent>
      </div>
    </Tabs>
  );
}
