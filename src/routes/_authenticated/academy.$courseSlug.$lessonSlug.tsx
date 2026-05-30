import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getLessonDetail, markLessonComplete } from "@/lib/academy.db.functions";
import {
  Loader2, ArrowLeft, ArrowRight, CheckCircle2, Video, FileText, BookOpen, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { AffiliateProductList } from "@/components/academy/AffiliateProductList";

export const Route = createFileRoute("/_authenticated/academy/$courseSlug/$lessonSlug")({
  component: LessonPage,
  head: ({ params }) => ({ meta: [{ title: `${params.lessonSlug} — Lesson` }] }),
});

function getVideoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return null;
}

function LessonPage() {
  const { courseSlug, lessonSlug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getLessonDetail);
  const completeFn = useServerFn(markLessonComplete);

  const { data, isLoading, error } = useQuery({
    queryKey: ["academy-lesson", courseSlug, lessonSlug],
    queryFn: () => fetchFn({ data: { courseSlug, lessonSlug } }),
  });

  const completeMut = useMutation({
    mutationFn: () => completeFn({ data: { courseSlug, lessonSlug } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-lesson", courseSlug, lessonSlug] });
      qc.invalidateQueries({ queryKey: ["academy-course", courseSlug] });
      qc.invalidateQueries({ queryKey: ["academy-db-courses"] });
      toast.success("Lesson marked complete");
      if (data?.next) {
        navigate({ to: "/academy/$courseSlug/$lessonSlug", params: { courseSlug, lessonSlug: data.next.slug } });
      } else {
        navigate({ to: "/academy/$courseSlug/quiz", params: { courseSlug } });
      }
    },
  });

  if (isLoading) {
    return (
      <DashboardShell title="Loading lesson…" subtitle="">
        <Loader2 className="size-6 animate-spin text-primary" />
      </DashboardShell>
    );
  }
  if (error || !data) {
    return (
      <DashboardShell title="Lesson not found" subtitle="">
        <Link to="/academy/$courseSlug" params={{ courseSlug }} className="text-primary text-sm">← Back to course</Link>
      </DashboardShell>
    );
  }

  const embed = data.lesson.video_url ? getVideoEmbed(data.lesson.video_url) : null;

  return (
    <DashboardShell
      title={data.lesson.title}
      subtitle={`${data.course.title} · Lesson ${data.lesson.index} of ${data.course.total_lessons}`}
    >
      <Link
        to="/academy/$courseSlug"
        params={{ courseSlug }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" /> Back to course
      </Link>

      {/* Video */}
      {embed && (
        <div className="rounded-2xl border border-border bg-black mb-6 overflow-hidden">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embed}
              title={data.lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}
      {data.lesson.video_url && !embed && (
        <a
          href={data.lesson.video_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6"
        >
          <Video className="size-4" /> Open lesson video
        </a>
      )}

      {/* Body */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 mb-6">
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <BookOpen className="size-3.5" /> Training content
        </div>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line">
          {data.lesson.content}
        </div>
        {data.lesson.checklist && data.lesson.checklist.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Field checklist</div>
            <ul className="space-y-1.5">
              {data.lesson.checklist.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Completion + nav */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          {data.completed ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="size-4" /> Lesson completed
            </span>
          ) : (
            <span className="text-muted-foreground">Mark this lesson complete to unlock the next one.</span>
          )}
        </div>
        {!data.completed && (
          <Button onClick={() => completeMut.mutate()} disabled={completeMut.isPending}>
            {completeMut.isPending ? <Loader2 className="size-4 animate-spin" /> : (
              <><CheckCircle2 className="size-4 mr-1.5" /> Mark complete &amp; continue</>
            )}
          </Button>
        )}
      </div>

      <AffiliateProductList products={(data as any).products ?? []} />

      <div className="flex items-center justify-between gap-3">
        {data.prev ? (
          <Button variant="outline" size="sm" asChild>
            <Link to="/academy/$courseSlug/$lessonSlug" params={{ courseSlug, lessonSlug: data.prev.slug }}>
              <ArrowLeft className="size-4 mr-1.5" /> Previous: {data.prev.title}
            </Link>
          </Button>
        ) : <span />}

        {data.next ? (
          <Button variant="outline" size="sm" asChild>
            <Link to="/academy/$courseSlug/$lessonSlug" params={{ courseSlug, lessonSlug: data.next.slug }}>
              Next: {data.next.title} <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link to="/academy/$courseSlug/quiz" params={{ courseSlug }}>
              <ClipboardList className="size-4 mr-1.5" /> Take final quiz
            </Link>
          </Button>
        )}
      </div>
    </DashboardShell>
  );
}
