import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getCourseCertification } from "@/lib/academy.db.functions";
import { Loader2, ArrowLeft, Award, Download, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/academy/$courseSlug/certificate")({
  component: CertificatePage,
  head: ({ params }) => ({ meta: [{ title: `${params.courseSlug} certificate — Academy` }] }),
});

function CertificatePage() {
  const { courseSlug } = Route.useParams();
  const fetchFn = useServerFn(getCourseCertification);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["academy-cert", courseSlug],
    queryFn: () => fetchFn({ data: { courseSlug } }),
  });

  async function download() {
    try {
      setDownloading(true);
      window.print();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate certificate");
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardShell title="Loading…" subtitle="">
        <Loader2 className="size-6 animate-spin text-primary" />
      </DashboardShell>
    );
  }
  if (error || !data) {
    return (
      <DashboardShell title="Certificate not found" subtitle="">
        <Link to="/academy" className="text-primary text-sm">← Back to Academy</Link>
      </DashboardShell>
    );
  }

  const title = data.course.title;
  const passed = data.passed;
  const issuedAt = data.certification?.issued_at ?? null;
  const bestScore = data.best_score;

  if (!passed) {
    return (
      <DashboardShell title={`${title} — Certificate`} subtitle="Locked until you pass the final quiz.">
        <Link to="/academy/$courseSlug" params={{ courseSlug }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> Back to course
        </Link>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-8 text-center">
          <Lock className="size-8 mx-auto text-muted-foreground mb-3" />
          <div className="text-base font-semibold mb-1">Certificate not yet earned</div>
          <p className="text-sm text-muted-foreground mb-4">
            Pass the final quiz to unlock your certificate.
          </p>
          <Button size="sm" asChild>
            <Link to="/academy/$courseSlug/quiz" params={{ courseSlug }}>Take the quiz</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={`${title} — Certificate`} subtitle="Congratulations on completing this course.">
      <Link to="/academy/$courseSlug" params={{ courseSlug }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Back to course
      </Link>

      <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-emerald-500/5 backdrop-blur p-10 text-center mb-6">
        <Award className="size-16 mx-auto text-amber-400 mb-4" />
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">REI Runner Academy</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Certificate of completion</div>
        <div className="my-6 border-y border-border py-6">
          <div className="text-sm text-muted-foreground italic">This certifies the successful completion of</div>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{title}</h1>
          <div className="text-sm text-muted-foreground mt-3">
            Final score: <span className="text-foreground font-semibold">{bestScore}%</span>
          </div>
          {issuedAt && (
            <div className="text-xs text-muted-foreground mt-1">
              Issued {new Date(issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
        </div>
        <Button onClick={download} disabled={downloading} size="lg">
          {downloading ? <Loader2 className="size-4 animate-spin" /> : (
            <><Download className="size-4 mr-1.5" /> Print / save certificate</>
          )}
        </Button>
      </div>
    </DashboardShell>
  );
}
