## Goal

Make every task post template-driven, let investors request brand-new task types when nothing fits, and give runners a guided, step-by-step checklist they work through from accept → complete (the "Shipt-style" flow).

## What's already in place

- `task_templates` table with name, type, category, deliverables, addons, pricing, est_minutes, includes/excludes notes. 16 system templates already exist.
- Investor `PostTaskWizard` already pulls templates via `templates.functions.ts`.
- Tasks already track `runner_state` (accepted → en_route → arrived → in_progress → completed → verified), GPS, and submissions.

What's missing: a structured **checklist definition** on each template, per-task **checklist progress** for runners, and a path for investors to **propose a new task type** for admin review.

## Plan

### 1. Template checklist schema (migration)

Add to `task_templates`:
- `required_fields jsonb` — extra inputs the investor must fill on the post form (e.g. lockbox code, gate code, contact name, grocery list, document recipient). Each entry: `{ key, label, type: text|number|textarea|address|phone|list|file, required, help }`.
- `runner_steps jsonb` — ordered checklist the runner walks through. Each step: `{ key, title, instructions, type: photo|video|scan|checkbox|signature|note|geofence_arrive|item_list|upload, required, min_count, accept_mime, geofence_required }`.
- `intro_notes text` — what the runner reads before starting.

Seed `runner_steps` for the 16 existing system templates (e.g. Property Photos = arrive on-site → exterior front photo → each side → back → street view → submit; Lockbox Install = arrive → photo of door → install → photo of installed lockbox + code confirmation; Occupancy Check = arrive → 3 exterior photos → note observations → optional knock result).

### 2. Per-task checklist progress (migration)

New table `task_checklist_progress`:
- `task_id`, `step_key`, `status` (pending|skipped|done), `completed_at`, `data jsonb` (notes, scanned item, count), `file_ids uuid[]` (linking `task_files`).
- Unique `(task_id, step_key)`.
- RLS: runner sees/writes own task rows; investor sees rows for their tasks; admin all. Standard GRANTs.

Add `tasks.template_id uuid references task_templates(id)` and `tasks.template_inputs jsonb` (snapshot of investor-filled `required_fields`).

### 3. New-task-type requests (migration)

New table `task_type_requests`:
- `requester_id`, `proposed_name`, `task_type_slug`, `description`, `deliverables text[]`, `suggested_payout`, `example_inputs jsonb`, `status` (pending|approved|rejected|needs_info), `admin_notes`, `created_template_id`.
- RLS: requester sees own; admins all. GRANTs.
- Trigger → notification to admins on insert, to requester on status change.

### 4. Investor post-task UX

In `PostTaskWizard`:
- Step 1: pick a template (current grid) **or** "My task isn't listed → Request a new task type".
- Step 2 (template path): render dynamic form from `template.required_fields` in addition to address/date/notes. Save filled values into `tasks.template_inputs`.
- Step 2 (request path): short form posts to `task_type_requests`; investor sees a "Pending admin review" card on their dashboard and can't post until approved (or admin can convert + assign immediately).

### 5. Runner guided checklist UX

New route `/_authenticated/tasks/$taskId/run` (or a panel inside the existing task page):
- Loads the task + its template's `runner_steps` + current `task_checklist_progress`.
- Renders one step at a time with progress bar (e.g. "Step 3 of 7 — Photo of front exterior").
- Per step type:
  - `photo` / `video` / `upload` → camera/file capture → uploads to `task-deliverables` bucket → writes file row + marks step done. Enforce `min_count` and geofence (uses existing `last_ping_within_geofence`).
  - `scan` (grocery / item list) → barcode scan via `@zxing/browser` (web) and Capacitor Barcode plugin (native), checks against `template_inputs.item_list`. Pure-checklist fallback if no barcode.
  - `checkbox` / `note` / `signature` → simple confirmation/text/signature pad.
  - `geofence_arrive` → auto-completes when GPS shows inside radius (ties into existing auto-arrive).
- "Complete task" button enabled only when all required steps are done; triggers submission flow that already exists.
- Investor task detail surfaces the same checklist read-only with thumbnails + timestamps so they can verify progress in real time.

### 6. Admin review surface

In existing admin area:
- "Task type requests" list with approve / reject / "Create template from request" action. Approving opens a pre-filled template editor (name, deliverables, pricing, steps) and on save inserts into `task_templates` and links `created_template_id`; requester is notified and the new template appears in their wizard.

### 7. Server functions

- `templates.functions.ts`: add `requestNewTaskType`, `listMyTaskTypeRequests`, admin `listTaskTypeRequests` + `approveTaskTypeRequest` + `rejectTaskTypeRequest`.
- New `checklist.functions.ts`: `getTaskChecklist(taskId)`, `updateChecklistStep({ taskId, step_key, status, data, file_ids })`, `completeChecklistTask(taskId)`. All use `requireSupabaseAuth` and rely on RLS.

### 8. Out of scope (call out, don't build)

- Native barcode scanning hardware testing on physical iPhone (web/zxing works; native plugin wired but only verifiable on device).
- Reworking pricing/addons (already wired through templates).
- Investor-side editing of system template steps (only admins edit templates).

## Open questions

1. **Item-scan flow** — for Shipt-style grocery, where does the item list come from? Most likely answers: (a) investor types/pastes the list when posting, (b) investor uploads a CSV, (c) investor enters store + budget and runner adds items as they shop. Want to confirm before designing the scan step.
2. **Hard-block on missing steps?** — should runner be physically unable to mark complete until every required step is checked off, or allowed to submit with admin override?
3. **Geofence requirement per step** — should photo steps require the runner be inside the property geofence, or only the "arrive" step?