# Notify runners when a new task is posted

When an investor posts a task (single or bulk), email every eligible runner so they can pick it up quickly. SMS is intentionally out of scope for this change.

## Eligibility

A runner gets the email only if all are true:
- `profile.role = 'runner'` and account is active (not banned/suspended)
- `notification_prefs.email_enabled` is not `false`
- `notification_prefs.new_task_alerts` is not `false`
- Runner is in the same `state` as the task (simple geo filter to avoid spamming the whole country — investor's `state` field). If their state is empty, they're excluded.
- Runner email is not in `suppressed_emails` (already enforced by `sendTransactionalEmail`)

If the task has a `preferred_runner_id`, only that runner is emailed (it's effectively a direct assignment, not a marketplace alert).

## New email template

Add `src/lib/email-templates/new-task-available.tsx` (registered in `registry.ts`) using the existing brand wrapper:
- Subject: `New {task_type} task in {city}, {state} — ${payout}`
- Preview: task title + city
- Body: title, type, city/state, payout, due date, short description, "View task" CTA → `https://reirunner.com/tasks/{id}`
- Props: `{ title, taskType, city, state, payoutAmount, dueDate, description, taskUrl, runnerFirstName }`

## Server wiring

New helper in `src/lib/tasks.functions.ts` (private, not exported as a server fn):

```
async function notifyRunnersOfNewTask(task)
```

- Loads eligible runner emails via `supabaseAdmin` with the filters above.
- Calls `sendTransactionalEmail` per runner (one recipient per send, per email rules), in a `Promise.allSettled` loop, swallowing individual failures.
- Logs counts; never blocks task creation if email fails.

Call sites:
- `createInvestorTask` — fire-and-forget after the insert returns the row (skip if `preferred_runner_id` is set → email only that runner).
- `bulkCreateInvestorTasks` — same, called once per created task.

Because runners are emailed individually, this stays inside the transactional-email rules (one trigger → one recipient).

## Settings UI

No changes needed — `new_task_alerts` and `email_enabled` toggles already exist on `/settings/notifications`. Runners who disable either won't receive the email.

## Out of scope

- SMS notifications (planned for later, separate change).
- Push notifications / OneSignal fan-out (already handled elsewhere if at all; not touched here).
- Skill/radius matching beyond same-state filter — can add later if volume justifies.
- Digest/batching — every new task triggers an immediate email.

## Files touched

- `src/lib/email-templates/new-task-available.tsx` (new)
- `src/lib/email-templates/registry.ts` (register template)
- `src/lib/tasks.functions.ts` (add `notifyRunnersOfNewTask`, call from both create paths)
