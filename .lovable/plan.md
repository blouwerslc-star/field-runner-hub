## Goal

On the `/tasks` page, when example task cards are shown (empty marketplace state), tapping a card opens a popup that previews the template for that task type — split into an **Investor brief** (what they post / pay for) and a **Runner checklist** (what they execute on-site).

## UX

- Trigger: tap/click the card (and Enter/Space for keyboard). Hover on desktop adds a subtle "Preview template →" affordance, but does not open the dialog (avoids accidental opens, works the same on touch).
- Surface: `shadcn` `Dialog` on desktop, `Sheet` (bottom) on mobile via existing `useIsMobile`. Closable via X, esc, backdrop.
- Header: task type chip + title + city/state + payout.
- Body: two-column on desktop (`Investor` | `Runner`), stacked on mobile, each in its own labeled card with an icon.
- Footer: "Become a Runner" + "Post a Task" CTAs (same as empty-state buttons), plus a small "Example only — not a live task" disclaimer.

## Template content

Define a per-`task_type` template map in a new `src/lib/sample-task-templates.ts`:

```ts
type SampleTemplate = {
  investor: {
    summary: string;           // 1-line what this gets you
    fields: string[];          // what the investor fills in when posting
    deliverables: string[];    // what they receive back
    typicalPayout: string;     // e.g. "$45–85"
  };
  runner: {
    summary: string;           // 1-line what the runner does
    checklist: string[];       // ordered steps shown as numbered list
    photoRequirements: string[]; // required shots
    estTime: string;           // e.g. "20–30 min on-site"
  };
};
```

Three entries matching current SAMPLE_TASKS: `property_photos`, `occupancy_check`, `walkthrough_video`. Content is hand-written, realistic, and matches how the real `tasks.$taskId.run.tsx` checklist runner already structures steps (arrive → photos → notes → submit).

## Files

- **new** `src/lib/sample-task-templates.ts` — the template map + types
- **new** `src/components/tasks/SampleTaskTemplateDialog.tsx` — dialog/sheet that takes `{ open, onOpenChange, sample, template }` and renders the two-pane preview
- **edit** `src/routes/tasks.tsx` — convert each example card `<div>` into a `<button>` that sets `selectedSampleId`; render `<SampleTaskTemplateDialog>` once below the grid. Add a small "Tap to preview template" hint badge to the card on `<sm` so the affordance is obvious on touch.

## Out of scope

- Loading real `task_templates` from the DB for these previews — these are static marketing examples.
- Adding previews to real (non-sample) task cards in the live marketplace.
- Editing the on-site runner checklist engine.
