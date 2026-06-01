import { Link } from "@tanstack/react-router";
import {
  Camera,
  MapPinned,
  ClipboardCheck,
  Video,
  ArrowRight,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DELIVERABLES = [
  {
    icon: Camera,
    title: "Property Photo Set",
    desc: "A complete exterior and interior photo set for underwriting, rehab estimates, listings, or remote due diligence.",
    bullets: [
      "Street view",
      "Front, rear, left, and right elevations",
      "Roofline and foundation",
      "Kitchen, bathrooms, bedrooms, mechanicals",
      "Visible damage or repair concerns",
      "Geotagged and timestamped uploads",
    ],
  },
  {
    icon: MapPinned,
    title: "Drive-By Report",
    desc: "A fast exterior condition check when an investor needs eyes on a property before making a decision.",
    bullets: [
      "Curbside photos",
      "Exterior condition notes",
      "Occupancy indicators",
      "Neighborhood snapshot",
      "Access or safety concerns",
      "Timestamped completion record",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Occupancy Check",
    desc: "A non-invasive field report to help determine whether a property appears vacant, occupied, abandoned, or unclear.",
    bullets: [
      "Visible signs of occupancy",
      "Vehicles, mail, trash bins, lights, or curtains",
      "Exterior photos",
      "Written observations",
      "No tenant contact required",
      "Clear status label: Vacant / Occupied / Unclear",
    ],
  },
  {
    icon: Video,
    title: "Walkthrough Video",
    desc: "A guided interior or exterior walkthrough video for investors who need more context than still photos.",
    bullets: [
      "Continuous walkthrough video",
      "Narrated condition notes",
      "Exterior-to-interior flow when access is permitted",
      "Major room-by-room coverage",
      "Visible repair concerns",
      "Summary notes after upload",
    ],
  },
];

const SAMPLE_NOTES = [
  "Exterior: vinyl siding intact, 1 missing panel on north elevation.",
  "Roof: shingles uniform, no visible sagging or tarping.",
  "Windows: all intact, no boarding. Front storm door unlatched.",
  "Yard: mowed within ~2 weeks, no debris pile, no posted notices.",
  "Occupancy: mail not accumulated, blinds partially open — appears occupied.",
];

export function SampleDeliverablesSection({
  variant = "default",
}: {
  variant?: "default" | "muted";
}) {
  const bg = variant === "muted" ? "bg-card/30" : "";
  return (
    <section
      aria-labelledby="sample-deliverables-heading"
      className={`border-t border-border/60 ${bg}`}
    >
      <div className="mx-auto max-w-7xl px-5 py-14 md:py-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
            <FileText className="size-3.5" /> Sample Deliverables
          </div>
          <h2
            id="sample-deliverables-heading"
            className="mt-3 text-3xl md:text-4xl font-bold tracking-tight"
          >
            See Exactly What You Get Back
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg leading-relaxed">
            Every REI Runner task produces structured, timestamped deliverables
            inside the platform — not scattered text messages or random photo
            dumps. Investors can review photos, videos, notes, and completion
            details before approving the task.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DELIVERABLES.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card flex flex-col"
            >
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <d.icon className="size-5 text-primary" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold">{d.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {d.desc}
              </p>
              <div className="my-4 h-px bg-border/70" />
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                Sample checklist
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {d.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 text-primary shrink-0" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sample Report Preview */}
        <div className="mt-12 md:mt-16">
          <div className="rounded-2xl border border-border bg-card/70 backdrop-blur overflow-hidden shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  Sample Report Preview
                </div>
                <div className="mt-1 font-semibold">
                  1428 Maple Ave{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    · Detroit, MI 48205
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-[11px] font-medium text-primary">
                Sample only
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-0 md:divide-x divide-border">
              {/* Meta */}
              <div className="p-5 md:p-6 space-y-3 text-sm">
                <Field label="Task type" value="Drive-By + Occupancy Check" />
                <Field label="Market" value="Detroit metro, MI" />
                <Field label="Completed" value="Mar 14, 2026 · 10:42 AM" />
                <Field label="Runner" value="Marcus J." />
                <Field
                  label="Status"
                  value={
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                  }
                />
                <Field label="Deliverables uploaded" value="23 photos · 1 video" />
                <Field
                  label="Investor approval"
                  value={
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Pending review
                    </span>
                  }
                />
              </div>

              {/* Notes */}
              <div className="p-5 md:p-6">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                  Condition Notes
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {SAMPLE_NOTES.map((n) => (
                    <li key={n} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Photos */}
              <div className="p-5 md:p-6">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                  Photo Uploads
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["Front elevation", "Rear elevation", "Roofline", "Street view"].map((label) => (
                    <div
                      key={label}
                      className="aspect-[4/3] rounded-lg border border-border/60 bg-gradient-to-br from-muted/60 to-muted/20 grid place-items-center text-[10px] text-muted-foreground text-center px-2"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="size-4 text-primary/70" aria-hidden />
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Placeholder thumbnails — actual reports include full geotagged
                  photo sets.
                </p>
              </div>
            </div>

            <div className="px-5 md:px-6 py-3 border-t border-border bg-muted/10 text-[11px] text-muted-foreground text-center">
              Example deliverable — not a live task. Address, runner, and
              timestamps shown for illustration only.
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
            <Link to="/signup" search={{ role: "investor", redirect: "/dashboard" }}>
              Post a Task <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}