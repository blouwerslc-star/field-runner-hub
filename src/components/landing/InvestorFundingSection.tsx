import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitInvestorInquiry } from "@/lib/investor-inquiries.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  PlayCircle,
  Rocket,
  ShieldCheck,
  TrendingUp,
  FileText,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Set this to a real YouTube/Vimeo embed URL when the pitch video is ready.
const INVESTOR_VIDEO_EMBED_URL: string | null = null;

const CARDS = [
  {
    icon: AlertTriangle,
    eyebrow: "The Problem",
    body: "Real estate investors need fast, reliable local property help without hiring full-time staff.",
  },
  {
    icon: Lightbulb,
    eyebrow: "The Solution",
    body: "REI Runner gives investors access to local runners who can complete property tasks on demand.",
  },
  {
    icon: TrendingUp,
    eyebrow: "The Opportunity",
    body: "With 100+ runners and growing, REI Runner is preparing for pre-seed funding to accelerate product development, marketing, and national expansion.",
  },
];

type AccreditedStatus = "yes" | "no" | "not_sure";
type InterestType = "equity" | "safe" | "revenue_share" | "strategic_partner";

export function InvestorFundingSection() {
  const submit = useServerFn(submitInvestorInquiry);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    investment_range: "",
    accredited_status: "" as "" | AccreditedStatus,
    interest_type: "" as "" | InterestType,
    message: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          investment_range: form.investment_range.trim(),
          accredited_status: form.accredited_status || null,
          interest_type: form.interest_type || null,
          message: form.message.trim(),
          source: "homepage-investor-section",
        },
      });
      setDone(true);
      toast.success("Thanks — we'll be in touch shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToForm() {
    document
      .getElementById("investor-interest-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToVideo() {
    document
      .getElementById("investor-pitch-video")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section
      id="invest"
      aria-labelledby="invest-heading"
      className="relative isolate border-y border-border/60 bg-card/30 backdrop-blur"
    >
      <div aria-hidden className="absolute inset-0 -z-10 grid-bg opacity-20" />
      <div className="mx-auto max-w-6xl px-4 sm:px-5 py-16 md:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-primary">
            <Rocket className="size-3.5" /> Pre-Seed Round · For Investors
          </span>
          <h2
            id="invest-heading"
            className="mt-3 text-3xl md:text-5xl font-bold tracking-tight"
          >
            Invest in the Future of Real Estate Field Work
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            REI Runner is building a nationwide network that connects real estate
            investors with local runners for property photos, walkthroughs, lockbox
            installs, occupancy checks, and field tasks.
          </p>
        </div>

        {/* Video */}
        <div
          id="investor-pitch-video"
          className="mt-10 rounded-2xl border border-border bg-background/60 backdrop-blur overflow-hidden shadow-card"
        >
          <div className="aspect-video w-full bg-muted/40 grid place-items-center relative">
            {INVESTOR_VIDEO_EMBED_URL ? (
              <iframe
                src={INVESTOR_VIDEO_EMBED_URL}
                title="REI Runner investor pitch video"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="text-center px-6 py-8">
                <PlayCircle className="size-12 md:size-14 text-primary mx-auto" />
                <p className="mt-3 text-sm md:text-base font-medium">
                  Investor pitch video coming soon
                </p>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                  YouTube / Vimeo embed will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={scrollToVideo} size="lg" variant="default">
            <PlayCircle className="size-4" /> Watch Investor Video
          </Button>
          <Button
            onClick={() => {
              update("message", "Please send me the investor deck.");
              scrollToForm();
            }}
            size="lg"
            variant="outline"
          >
            <FileText className="size-4" /> Request Investor Deck
          </Button>
          <Button
            onClick={() => {
              update("message", "I'd like to schedule an investor call.");
              scrollToForm();
            }}
            size="lg"
            variant="outline"
          >
            <CalendarClock className="size-4" /> Schedule Investor Call
          </Button>
        </div>

        {/* Problem / Solution / Opportunity */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.eyebrow}
              className="rounded-2xl border border-border bg-background/60 backdrop-blur p-6 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
                  <c.icon className="size-5 text-primary" />
                </div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-primary">
                  {c.eyebrow}
                </div>
              </div>
              <p className="mt-4 text-sm md:text-base text-foreground/90 leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>

        {/* Interest form */}
        <div
          id="investor-interest-form"
          className="mt-14 rounded-2xl border border-border bg-background/70 backdrop-blur p-6 md:p-10 shadow-card"
        >
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                Investor Interest Form
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Share a few details and we'll follow up with the right next step.
              </p>
            </div>
          </div>

          {done ? (
            <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold">Inquiry received</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thanks for your interest in REI Runner. A member of our team will
                  reach out by email shortly.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <Label htmlFor="inv-name">Full Name *</Label>
                <Input
                  id="inv-name"
                  required
                  maxLength={120}
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="inv-email">Email *</Label>
                <Input
                  id="inv-email"
                  type="email"
                  required
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@firm.com"
                />
              </div>
              <div>
                <Label htmlFor="inv-phone">Phone</Label>
                <Input
                  id="inv-phone"
                  type="tel"
                  maxLength={40}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
              <div>
                <Label htmlFor="inv-range">Investment Range</Label>
                <Select
                  value={form.investment_range}
                  onValueChange={(v) => update("investment_range", v)}
                >
                  <SelectTrigger id="inv-range">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<25k">Under $25k</SelectItem>
                    <SelectItem value="25k-50k">$25k – $50k</SelectItem>
                    <SelectItem value="50k-100k">$50k – $100k</SelectItem>
                    <SelectItem value="100k-250k">$100k – $250k</SelectItem>
                    <SelectItem value="250k-500k">$250k – $500k</SelectItem>
                    <SelectItem value="500k+">$500k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="inv-accredited">Accredited Investor</Label>
                <Select
                  value={form.accredited_status}
                  onValueChange={(v) => update("accredited_status", v as AccreditedStatus)}
                >
                  <SelectTrigger id="inv-accredited">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="not_sure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="inv-type">Interest Type</Label>
                <Select
                  value={form.interest_type}
                  onValueChange={(v) => update("interest_type", v as InterestType)}
                >
                  <SelectTrigger id="inv-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="safe">SAFE</SelectItem>
                    <SelectItem value="revenue_share">Revenue Share</SelectItem>
                    <SelectItem value="strategic_partner">Strategic Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="inv-message">Message</Label>
                <Textarea
                  id="inv-message"
                  maxLength={2000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Tell us a bit about your interest, timing, and any questions."
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>Submit Interest</>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  We respond within 1–2 business days.
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Legal disclaimer */}
        <p className="mt-8 text-xs leading-relaxed text-muted-foreground border-t border-border/60 pt-6">
          This page is for informational purposes only and does not constitute an
          offer to sell securities or a solicitation to buy securities. Investment
          opportunities, if available, will be handled through the appropriate
          legal and compliance process.
        </p>
      </div>
    </section>
  );
}