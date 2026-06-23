import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

/**
 * Daily cron: materialize the next occurrence of recurring tasks whose
 * recurrence_next_at has passed. Skips tasks where the previous occurrence
 * is still open/in-flight to avoid runaway duplication.
 */

const BATCH_LIMIT = 200

function computeNextRunAt(rule: string | null, from: Date = new Date()): string | null {
  if (!rule) return null
  const next = new Date(from)
  if (rule === 'weekly') next.setDate(next.getDate() + 7)
  else if (rule === 'biweekly') next.setDate(next.getDate() + 14)
  else if (rule === 'monthly') next.setMonth(next.getMonth() + 1)
  else return null
  return next.toISOString()
}

export const Route = createFileRoute('/api/public/hooks/recurring-tasks')({
  server: {
    handlers: {
      POST: async () => {
        const now = new Date().toISOString()
        const { data: due, error } = await supabaseAdmin
          .from('tasks')
          .select('*')
          .eq('recurrence_active', true)
          .not('recurrence_rule', 'is', null)
          .lte('recurrence_next_at', now)
          .limit(BATCH_LIMIT)
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

        let created = 0
        const errors: string[] = []
        for (const t of due ?? []) {
          try {
            const parentId = (t as any).recurrence_parent_id ?? t.id
            const { data: openSibling } = await supabaseAdmin
              .from('tasks')
              .select('id')
              .eq('recurrence_parent_id', parentId)
              .in('status', ['open', 'assigned', 'in_progress', 'submitted'])
              .limit(1)
              .maybeSingle()
            const nextAt = computeNextRunAt(t.recurrence_rule as string)
            if (openSibling) {
              // Skip materializing — push the next slot forward.
              await supabaseAdmin
                .from('tasks')
                .update({ recurrence_next_at: nextAt })
                .eq('id', t.id)
              continue
            }
            const { error: insErr } = await supabaseAdmin.from('tasks').insert({
              investor_id: t.investor_id,
              title: t.title,
              description: t.description,
              task_type: t.task_type,
              property_address: t.property_address,
              city: t.city,
              state: t.state,
              zip_code: t.zip_code,
              payout_amount: t.payout_amount,
              requires_interior_access: (t as any).requires_interior_access,
              preferred_runner_id: (t as any).preferred_runner_id ?? t.runner_id,
              recurrence_parent_id: parentId,
              status: 'open',
            })
            if (insErr) {
              errors.push(insErr.message)
              continue
            }
            await supabaseAdmin
              .from('tasks')
              .update({ recurrence_next_at: nextAt })
              .eq('id', t.id)
            created++
          } catch (e) {
            errors.push((e as Error).message)
          }
        }

        return Response.json({ ok: true, examined: due?.length ?? 0, created, errors })
      },
    },
  },
})