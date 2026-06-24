import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTransactionalEmail } from './email-sender.server'

export interface NewTaskNotifyInput {
  id: string
  title: string
  task_type?: string | null
  city?: string | null
  state?: string | null
  payout_amount?: number | null
  due_date?: string | null
  description?: string | null
  preferred_runner_id?: string | null
}

const SITE_BASE = 'https://reirunner.com'

function isOptedIn(prefs: unknown): boolean {
  if (!prefs || typeof prefs !== 'object') return true // default opt-in
  const p = prefs as Record<string, unknown>
  if (p.email_enabled === false) return false
  if (p.new_task_alerts === false) return false
  return true
}

export async function notifyRunnersOfNewTask(task: NewTaskNotifyInput): Promise<{ sent: number; skipped: number }> {
  try {
    const taskUrl = `${SITE_BASE}/tasks/${task.id}`
    const baseData = {
      title: task.title,
      taskType: task.task_type ?? undefined,
      city: task.city ?? undefined,
      state: task.state ?? undefined,
      payoutAmount: task.payout_amount ?? null,
      dueDate: task.due_date ?? null,
      description: task.description ?? null,
      taskUrl,
    }

    // Preferred runner = direct alert only
    if (task.preferred_runner_id) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name, notification_prefs')
        .eq('user_id', task.preferred_runner_id)
        .maybeSingle()
      if (!prof?.email || !isOptedIn(prof.notification_prefs)) return { sent: 0, skipped: 1 }
      await sendTransactionalEmail({
        templateName: 'new_task_available',
        recipientEmail: prof.email,
        templateData: { ...baseData, runnerFirstName: (prof.full_name ?? '').split(' ')[0] || 'there' },
      })
      return { sent: 1, skipped: 0 }
    }

    // Find runners
    const { data: runnerRoles, error: rolesErr } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'runner')
    if (rolesErr || !runnerRoles?.length) return { sent: 0, skipped: 0 }
    const ids = runnerRoles.map((r) => r.user_id)

    let query = supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name, state, notification_prefs')
      .in('user_id', ids)
      .not('email', 'is', null)
    if (task.state) query = query.eq('state', task.state)
    const { data: profiles, error: profErr } = await query
    if (profErr || !profiles?.length) return { sent: 0, skipped: 0 }

    let sent = 0
    let skipped = 0
    const results = await Promise.allSettled(
      profiles.map(async (p) => {
        if (!p.email || !isOptedIn(p.notification_prefs)) {
          skipped++
          return
        }
        const r = await sendTransactionalEmail({
          templateName: 'new_task_available',
          recipientEmail: p.email,
          templateData: { ...baseData, runnerFirstName: (p.full_name ?? '').split(' ')[0] || 'there' },
        })
        if (r.ok) sent++
        else skipped++
      }),
    )
    for (const r of results) if (r.status === 'rejected') skipped++
    console.log('[notify-new-task]', { taskId: task.id, sent, skipped, candidates: profiles.length })
    return { sent, skipped }
  } catch (e) {
    console.error('[notify-new-task] failed', e)
    return { sent: 0, skipped: 0 }
  }
}