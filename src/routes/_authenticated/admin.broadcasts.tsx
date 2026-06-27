import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RouteErrorState } from "@/components/dashboard/UiStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, ArrowLeft, Save, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listApplicants,
  sendBroadcast,
  listBroadcastHistory,
  listTemplateOverrides,
  saveTemplateOverride,
  resetTemplateOverride,
} from "@/lib/broadcasts.functions";

export const Route = createFileRoute("/_authenticated/admin/broadcasts")({
  component: BroadcastsPage,
  head: () => ({ meta: [{ title: "Broadcasts — Admin — REI Runner" }] }),
  errorComponent: ({ error, reset }) => <RouteErrorState error={error} reset={reset} />,
});

type Audience = "runner" | "investor" | "lead";

type TemplateKey =
  | "signup_reminder"
  | "second_reminder"
  | "final_reminder"
  | "launch_countdown"
  | "market_launch_update"
  | "platform_update"
  | "new_features_update";

type TemplateDef = { label: string; category: "Reminder" | "Update"; subject: string; html: string };

const TEMPLATES: Record<Audience, Record<TemplateKey, TemplateDef>> = {
  runner: {
    signup_reminder: {
      label: "Signup reminder",
      category: "Reminder",
      subject:
        "Your spot is waiting, {{firstName}} — finish setting up your Runner account",
      html: `<p>Hi {{firstName}},</p>
<p>Thanks again for applying to be a REI Runner. We're rolling out access market by market, and we want you ready to take jobs the moment they hit your area.</p>
<p>The next step is quick: create your account, verify your details, and complete your runner profile so investors can start sending work your way.</p>
<p><a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Finish setting up my Runner account</a></p>
<p>Questions? Just reply to this email.</p>
<p>— The REI Runner Team</p>`,
    },
    second_reminder: {
      label: "2nd nudge — profile incomplete",
      category: "Reminder",
      subject: "{{firstName}}, you're 2 minutes away from your first runner job",
      html: `<p>Hi {{firstName}},</p>
<p>Just a quick nudge — your REI Runner application is in, but your account isn't fully set up yet. Investors can't route paid jobs to you until your profile is live.</p>
<p>It takes about 2 minutes:</p>
<ol>
  <li>Create your account</li>
  <li>Verify your phone and ID</li>
  <li>Confirm the task types you'll accept</li>
</ol>
<p><a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Finish my Runner profile</a></p>
<p>— The REI Runner Team</p>`,
    },
    final_reminder: {
      label: "Final reminder",
      category: "Reminder",
      subject: "Last call, {{firstName}} — we're closing your runner application",
      html: `<p>Hi {{firstName}},</p>
<p>We're cleaning up our runner waitlist this week. If you'd still like a spot, this is the time to finish setting up your account — otherwise we'll release your slot to the next applicant in your market.</p>
<p><a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Claim my Runner spot</a></p>
<p>No hard feelings if now isn't the right time — just reply and let us know.</p>
<p>— The REI Runner Team</p>`,
    },
    launch_countdown: {
      label: "Launch countdown — 1-2 months out",
      category: "Update",
      subject: "Live tasks are 1-2 months away, {{firstName}} — finish verification now",
      html: `<p>Hi {{firstName}},</p>
<p>Quick heads-up: REI Runner is about <strong>1-2 months away</strong> from going live with paid tasks in your area.</p>
<p>Runners <strong>must</strong> finish the verification process before then — unverified accounts will <em>not</em> be able to claim tasks at launch.</p>
<p><a href="https://reirunner.com/dashboard/runner/verification" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Finish verification</a></p>
<p>It takes just a few minutes. Get it out of the way now so you're first in line when tasks start hitting your market.</p>
<p>— The REI Runner Team</p>`,
    },
    market_launch_update: {
      label: "Market launch update",
      category: "Update",
      subject: "{{firstName}}, REI Runner is live in your market",
      html: `<p>Hi {{firstName}},</p>
<p>Big update — REI Runner just went live in your area. Investors are actively posting tasks (lockbox checks, drive-bys, photos, sign installs) and we want vetted runners like you on deck.</p>
<p>Log in, accept your first task, and get paid the same week.</p>
<p><a href="https://reirunner.com/login" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Open available tasks</a></p>
<p>— The REI Runner Team</p>`,
    },
    platform_update: {
      label: "Platform update",
      category: "Update",
      subject: "What's new on REI Runner this month, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>Quick update on what we shipped recently for runners:</p>
<ul>
  <li><strong>Faster payouts</strong> — funds released as soon as your submission is approved.</li>
  <li><strong>In-app navigation</strong> — one tap to route to the property.</li>
  <li><strong>Background check tier</strong> — unlock interior-access tasks and higher payouts.</li>
</ul>
<p><a href="https://reirunner.com/dashboard/runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">See what's new</a></p>
<p>— The REI Runner Team</p>`,
    },
    new_features_update: {
      label: "New features announcement",
      category: "Update",
      subject: "New tools for runners are here, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>We just rolled out a few things you asked for:</p>
<ul>
  <li><strong>Availability blocks</strong> — only get matched when you're free.</li>
  <li><strong>Service area map</strong> — set exactly where you'll travel.</li>
  <li><strong>Portfolio</strong> — show off past work to win better-paying tasks.</li>
</ul>
<p><a href="https://reirunner.com/profile/edit" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Update my profile</a></p>
<p>— The REI Runner Team</p>`,
    },
  },
  investor: {
    signup_reminder: {
      label: "Signup reminder",
      category: "Reminder",
      subject: "{{firstName}}, finish setting up your REI Runner investor account",
      html: `<p>Hi {{firstName}},</p>
<p>Thanks for your interest in REI Runner. You're on the early access list for investors — the next step is to create your account so you can post tasks and start working with vetted runners in your market.</p>
<p><a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Finish setting up my Investor account</a></p>
<p>If you have questions about pricing, markets, or how runners are vetted, just reply to this email.</p>
<p>— The REI Runner Team</p>`,
    },
    second_reminder: {
      label: "2nd nudge — post your first task",
      category: "Reminder",
      subject: "{{firstName}}, ready to put boots on the ground?",
      html: `<p>Hi {{firstName}},</p>
<p>Your investor account is created — but you haven't posted a task yet. Most investors get their first deliverable (photos, lockbox check, drive-by) back in under 24 hours.</p>
<p><a href="https://reirunner.com/tasks?new=1" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Post my first task</a></p>
<p>Need help scoping the task? Just reply — we'll write it with you.</p>
<p>— The REI Runner Team</p>`,
    },
    final_reminder: {
      label: "Final reminder",
      category: "Reminder",
      subject: "Closing your investor spot, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>We're tightening our early-access list this week. If REI Runner still fits your workflow, this is the moment to claim your spot — otherwise we'll release it.</p>
<p><a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Keep my Investor spot</a></p>
<p>— The REI Runner Team</p>`,
    },
    launch_countdown: {
      label: "Launch countdown — 1-2 months out",
      category: "Update",
      subject: "{{firstName}}, REI Runner goes live in 1-2 months",
      html: `<p>Hi {{firstName}},</p>
<p>Quick update: REI Runner is about <strong>1-2 months away</strong> from running paid tasks at full scale in your markets.</p>
<p>Now's a great moment to finish setting up your investor account so you can post your first jobs the moment vetted runners go live in your area.</p>
<p><a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Finish my investor setup</a></p>
<p>— The REI Runner Team</p>`,
    },
    market_launch_update: {
      label: "Market coverage update",
      category: "Update",
      subject: "{{firstName}}, we just added runners in your markets",
      html: `<p>Hi {{firstName}},</p>
<p>Update from REI Runner — we just onboarded a fresh batch of vetted runners in your target markets. Coverage is broader, response times are faster, and lockbox / drive-by jobs are turning around same-day.</p>
<p><a href="https://reirunner.com/tasks?new=1" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Post a task</a></p>
<p>— The REI Runner Team</p>`,
    },
    platform_update: {
      label: "Platform update",
      category: "Update",
      subject: "What's new on REI Runner this month, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>A few things we shipped for investors recently:</p>
<ul>
  <li><strong>Task templates</strong> — post common jobs in seconds.</li>
  <li><strong>Funded escrow</strong> — runners only get paid when you approve.</li>
  <li><strong>Background-checked runners</strong> for interior access.</li>
</ul>
<p><a href="https://reirunner.com/dashboard/investor" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">See what's new</a></p>
<p>— The REI Runner Team</p>`,
    },
    new_features_update: {
      label: "New features announcement",
      category: "Update",
      subject: "New investor tools just launched, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>You asked, we built:</p>
<ul>
  <li><strong>Favorite runners</strong> — send tasks straight to your A-team.</li>
  <li><strong>Bulk task posting</strong> — push 10+ addresses at once.</li>
  <li><strong>Deliverable previews</strong> — review photos before releasing payment.</li>
</ul>
<p><a href="https://reirunner.com/dashboard/investor" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Try the new tools</a></p>
<p>— The REI Runner Team</p>`,
    },
  },
  lead: {
    signup_reminder: {
      label: "Signup reminder",
      category: "Reminder",
      subject: "{{firstName}}, your REI Runner account is ready to claim",
      html: `<p>Hi {{firstName}},</p>
<p>Thanks for raising your hand for REI Runner — the marketplace that connects real estate investors with vetted, local field runners for lockbox checks, photos, drive-bys, sign installs, and more.</p>
<p>Whichever side you're on, the next step is the same: create your free account so you're set up the moment your market goes live.</p>
<p style="margin:24px 0;text-align:center">
  <a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;margin:0 6px 8px 0">I'm a Runner — earn local jobs</a>
  <a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #16a34a;margin:0 6px 8px 0">I'm an Investor — get boots on the ground</a>
</p>
<p style="font-size:14px;color:#475569"><strong>Runners</strong> get paid per task in their area — no experience required, just a smartphone, transportation, and a willingness to show up. <strong>Investors</strong> get fast, reliable eyes on properties anywhere in the U.S. without hiring a full-time team.</p>
<p>Not sure which fits? Just reply to this email and we'll help you decide.</p>
<p>— The REI Runner Team</p>`,
    },
    second_reminder: {
      label: "2nd nudge",
      category: "Reminder",
      subject: "Still interested in REI Runner, {{firstName}}?",
      html: `<p>Hi {{firstName}},</p>
<p>Quick follow-up — you signed up to learn more about REI Runner but haven't created an account yet. We're now matching runners and investors live in dozens of U.S. markets.</p>
<p>Pick the side that fits you:</p>
<p style="margin:20px 0">
  <a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">I'm a Runner</a>
  <a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #16a34a">I'm an Investor</a>
</p>
<p>— The REI Runner Team</p>`,
    },
    final_reminder: {
      label: "Final reminder",
      category: "Reminder",
      subject: "Closing your spot on the REI Runner list, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>We're cleaning up our early-access list this week. If REI Runner still sounds useful, create your free account so we can hold your spot.</p>
<p><a href="https://reirunner.com/signup" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Claim my spot</a></p>
<p>If you've changed your mind, no need to reply — we'll quietly drop you from the list.</p>
<p>— The REI Runner Team</p>`,
    },
    launch_countdown: {
      label: "Launch countdown — 1-2 months out",
      category: "Update",
      subject: "REI Runner goes live in 1-2 months, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>Heads-up — REI Runner is <strong>1-2 months away</strong> from live, paid tasks at scale. If you've been on the fence, now's the time to grab your free account so you don't miss launch in your market.</p>
<p style="margin:20px 0">
  <a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">I'm a Runner</a>
  <a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #16a34a">I'm an Investor</a>
</p>
<p>Runners — finish your verification before launch or you won't be able to claim tasks.</p>
<p>— The REI Runner Team</p>`,
    },
    market_launch_update: {
      label: "Market launch update",
      category: "Update",
      subject: "{{firstName}}, REI Runner just launched in your area",
      html: `<p>Hi {{firstName}},</p>
<p>Great news — REI Runner is now live in your market. Runners are accepting tasks and investors are posting jobs daily.</p>
<p>Grab your account before your slot is reassigned:</p>
<p style="margin:20px 0">
  <a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">Sign up as Runner</a>
  <a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #16a34a">Sign up as Investor</a>
</p>
<p>— The REI Runner Team</p>`,
    },
    platform_update: {
      label: "Platform update",
      category: "Update",
      subject: "What's new on REI Runner, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>A quick recap of what we've shipped lately:</p>
<ul>
  <li>Vetted, background-checked runners for interior tasks</li>
  <li>Funded escrow so investors only pay on approved deliverables</li>
  <li>Faster payouts and in-app navigation for runners</li>
</ul>
<p><a href="https://reirunner.com/signup" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Create my account</a></p>
<p>— The REI Runner Team</p>`,
    },
    new_features_update: {
      label: "New features announcement",
      category: "Update",
      subject: "New on REI Runner: tools you'll actually use, {{firstName}}",
      html: `<p>Hi {{firstName}},</p>
<p>We just rolled out a batch of upgrades:</p>
<ul>
  <li>Smarter runner ↔ investor matching by market and task type</li>
  <li>Task templates for the most common jobs</li>
  <li>Better mobile experience end-to-end</li>
</ul>
<p><a href="https://reirunner.com/signup" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Get started</a></p>
<p>— The REI Runner Team</p>`,
    },
  },
};

const DEFAULT_TEMPLATE: TemplateKey = "signup_reminder";

function BroadcastsPage() {
  const [audience, setAudience] = useState<Audience>("runner");
  const [templateKey, setTemplateKey] = useState<TemplateKey>(DEFAULT_TEMPLATE);
  const [subject, setSubject] = useState(TEMPLATES.runner[DEFAULT_TEMPLATE].subject);
  const [html, setHtml] = useState(TEMPLATES.runner[DEFAULT_TEMPLATE].html);
  const [senderEmail, setSenderEmail] = useState("noreply@reirunner.com");
  const [senderName, setSenderName] = useState("REI Runner");
  const [onlyWithoutAccount, setOnlyWithoutAccount] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  const list = useServerFn(listApplicants);
  const send = useServerFn(sendBroadcast);
  const history = useServerFn(listBroadcastHistory);
  const listOverrides = useServerFn(listTemplateOverrides);
  const saveOverride = useServerFn(saveTemplateOverride);
  const resetOverride = useServerFn(resetTemplateOverride);

  const overridesQ = useQuery({
    queryKey: ["broadcast-template-overrides"],
    queryFn: () => listOverrides(),
  });

  const overrideMap = useMemo(() => {
    const m = new Map<string, { subject: string; html: string }>();
    for (const o of overridesQ.data?.overrides ?? []) {
      m.set(`${o.audience}:${o.template_key}`, { subject: o.subject, html: o.html });
    }
    return m;
  }, [overridesQ.data]);

  const currentOverride = overrideMap.get(`${audience}:${templateKey}`);
  const defaultTpl = TEMPLATES[audience][templateKey];
  const isDirty =
    subject !== (currentOverride?.subject ?? defaultTpl.subject) ||
    html !== (currentOverride?.html ?? defaultTpl.html);
  const [savingTpl, setSavingTpl] = useState(false);

  const applicantsQ = useQuery({
    queryKey: ["broadcast-applicants", audience],
    queryFn: () => list({ data: { audience } }),
  });
  const historyQ = useQuery({
    queryKey: ["broadcast-history"],
    queryFn: () => history(),
  });

  const applicants = applicantsQ.data?.applicants ?? [];
  const eligible = useMemo(
    () => applicants.filter((a) => (onlyWithoutAccount ? !a.has_account : true)),
    [applicants, onlyWithoutAccount],
  );

  const selectedIds = useMemo(
    () => eligible.filter((a) => selected[a.id]).map((a) => a.id),
    [eligible, selected],
  );

  function switchAudience(a: Audience) {
    setAudience(a);
    setTemplateKey(DEFAULT_TEMPLATE);
    const ov = overrideMap.get(`${a}:${DEFAULT_TEMPLATE}`);
    setSubject(ov?.subject ?? TEMPLATES[a][DEFAULT_TEMPLATE].subject);
    setHtml(ov?.html ?? TEMPLATES[a][DEFAULT_TEMPLATE].html);
    setSelected({});
    setLastResult(null);
  }

  function applyTemplate(key: TemplateKey) {
    setTemplateKey(key);
    const tpl = TEMPLATES[audience][key];
    const ov = overrideMap.get(`${audience}:${key}`);
    setSubject(ov?.subject ?? tpl.subject);
    setHtml(ov?.html ?? tpl.html);
  }

  async function handleSaveTemplate() {
    setSavingTpl(true);
    try {
      await saveOverride({ data: { audience, templateKey, subject, html } });
      toast.success("Template saved");
      await overridesQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save template");
    } finally {
      setSavingTpl(false);
    }
  }

  async function handleResetTemplate() {
    if (!currentOverride) {
      const tpl = TEMPLATES[audience][templateKey];
      setSubject(tpl.subject);
      setHtml(tpl.html);
      return;
    }
    if (!confirm("Reset this template to the built-in default? Your saved edits will be discarded.")) return;
    setSavingTpl(true);
    try {
      await resetOverride({ data: { audience, templateKey } });
      const tpl = TEMPLATES[audience][templateKey];
      setSubject(tpl.subject);
      setHtml(tpl.html);
      toast.success("Template reset to default");
      await overridesQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reset template");
    } finally {
      setSavingTpl(false);
    }
  }

  function toggleAll(checked: boolean) {
    if (!checked) return setSelected({});
    const next: Record<string, boolean> = {};
    for (const a of eligible) next[a.id] = true;
    setSelected(next);
  }

  async function handleSend() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    if (
      !confirm(
        `Send "${subject}" to ${selectedIds.length} ${audience} applicant(s)?`,
      )
    )
      return;
    setSending(true);
    setLastResult(null);
    try {
      const res = await send({
        data: {
          audience,
          subject,
          htmlContent: html,
          senderEmail,
          senderName,
          recipientIds: selectedIds,
          onlyWithoutAccount,
        },
      });
      setLastResult({ sent: res.sent, failed: res.failed, total: res.total });
      if (res.failed === 0) {
        toast.success(`Sent ${res.sent} email(s)`);
      } else {
        toast.warning(`Sent ${res.sent}, failed ${res.failed}`);
      }
      historyQ.refetch();
      setSelected({});
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardShell
      title="Broadcasts"
      subtitle="Re-engage applicants who haven't created an account yet."
    >
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin">
            <ArrowLeft className="size-4 mr-1" /> Back to Admin
          </Link>
        </Button>
      </div>

      <Tabs value={audience} onValueChange={(v) => switchAudience(v as Audience)}>
        <TabsList className="mb-6">
          <TabsTrigger value="runner">Runner applicants</TabsTrigger>
          <TabsTrigger value="investor">Investor applicants</TabsTrigger>
          <TabsTrigger value="lead">Facebook leads</TabsTrigger>
        </TabsList>

        <TabsContent value={audience} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
              <h3 className="font-semibold">Email content</h3>
              <div>
                <Label htmlFor="template">Template</Label>
                <Select value={templateKey} onValueChange={(v) => applyTemplate(v as TemplateKey)}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Reminders</div>
                    {(Object.entries(TEMPLATES[audience]) as [TemplateKey, TemplateDef][])
                      .filter(([, t]) => t.category === "Reminder")
                      .map(([k, t]) => (
                        <SelectItem key={k} value={k}>{t.label}</SelectItem>
                      ))}
                    <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Updates</div>
                    {(Object.entries(TEMPLATES[audience]) as [TemplateKey, TemplateDef][])
                      .filter(([, t]) => t.category === "Update")
                      .map(([k, t]) => (
                        <SelectItem key={k} value={k}>{t.label}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick a starting point, then edit subject and body below.
                </p>
              </div>
              <div>
                <Label htmlFor="from-name">From name</Label>
                <Input
                  id="from-name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="from-email">From email (must be verified in Brevo)</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="html">HTML body</Label>
                <Textarea
                  id="html"
                  rows={14}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use <code>{"{{firstName}}"}</code> for personalization.
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <div className="text-xs text-muted-foreground">
                  {currentOverride ? (
                    <span className="text-emerald-400">Custom version saved</span>
                  ) : (
                    <span>Using built-in default</span>
                  )}
                  {isDirty && <span className="ml-2 text-yellow-400">• Unsaved changes</span>}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetTemplate}
                    disabled={savingTpl}
                  >
                    <RotateCcw className="size-4 mr-1" /> Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={savingTpl || !isDirty}
                  >
                    {savingTpl ? (
                      <Loader2 className="size-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="size-4 mr-1" />
                    )}
                    Save template
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
              <h3 className="font-semibold">Live preview</h3>
              <div className="rounded-lg border border-border bg-background p-4 text-sm">
                <div className="text-xs text-muted-foreground mb-2">
                  From: {senderName} &lt;{senderEmail}&gt;
                </div>
                <div className="font-semibold mb-3">{subject}</div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold">Recipients</h3>
                <p className="text-xs text-muted-foreground">
                  {eligible.length} eligible · {selectedIds.length} selected
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="without-account"
                    checked={onlyWithoutAccount}
                    onCheckedChange={(v) => {
                      setOnlyWithoutAccount(v);
                      setSelected({});
                    }}
                  />
                  <Label htmlFor="without-account" className="text-xs">
                    Only applicants without an account
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(selectedIds.length !== eligible.length)}
                  disabled={eligible.length === 0}
                >
                  {selectedIds.length === eligible.length && eligible.length > 0
                    ? "Clear"
                    : "Select all"}
                </Button>
              </div>
            </div>

            {applicantsQ.isLoading ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : eligible.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No eligible applicants.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 w-10"></th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Market</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligible.map((a) => (
                      <tr key={a.id} className="border-t border-border/60">
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={!!selected[a.id]}
                            onCheckedChange={(v) =>
                              setSelected((s) => ({ ...s, [a.id]: !!v }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{a.full_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.email}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {[a.city, a.state].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {a.has_account ? (
                            <Badge variant="outline">Has account</Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">
                              No account
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-5">
              {lastResult ? (
                <div className="text-sm">
                  Last send: <span className="text-emerald-400">{lastResult.sent} sent</span>
                  {lastResult.failed > 0 && (
                    <span className="text-red-400 ml-2">{lastResult.failed} failed</span>
                  )}
                </div>
              ) : (
                <div />
              )}
              <Button onClick={handleSend} disabled={sending || selectedIds.length === 0}>
                {sending ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Send className="size-4 mr-2" />
                )}
                Send to {selectedIds.length} recipient{selectedIds.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-2xl border border-border bg-card/50 p-5 mt-8">
        <h3 className="font-semibold mb-4">Recent sends</h3>
        {historyQ.isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (historyQ.data?.sends ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No broadcasts sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Audience</th>
                  <th className="py-2 pr-3">Recipient</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(historyQ.data?.sends ?? []).map((s: any) => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">{s.audience}</td>
                    <td className="py-2 pr-3">{s.recipient_email}</td>
                    <td className="py-2 pr-3 truncate max-w-[280px]">{s.subject}</td>
                    <td className="py-2 pr-3">
                      {s.status === "sent" ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                          sent
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/40 text-red-300" title={s.error_message ?? ""}>
                          failed
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}