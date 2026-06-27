import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTransactionalEmail } from '@/lib/email-sender.server'

/**
 * Daily cron: nudge runners to complete the two prerequisites for accepting
 * tasks — identity verification and Academy training.
 *
 * Cadence: first reminder 3 days after signup, then every 2 days, per kind,
 * until the runner finishes that requirement.
 */

const BATCH_LIMIT = 200
const DAY = 24 * 60 * 60 * 1000
const FIRST_DELAY_MS = 3 * DAY
const REPEAT_DELAY_MS = 2 * DAY

type Kind = 'verification' | 'academy'

export const Route = createFileRoute('/api/public/hooks/eligibility-reminders')({
  server: {
    handlers: {
      POST: async () => {
        const now = Date.now()
        const firstEligibleBefore = new Date(now - FIRST_DELAY_MS).toISOString()

        // Pull runner user_ids
        const { data: runnerRoles } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'runner')
          .limit(2000)
        const runnerIds = (runnerRoles ?? []).map((r) => r.user_id)
        if (runnerIds.length === 0) {
          return Response.json({ ok: true, runners: 0 })
        }

        // Profiles (3d+ old) with email
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('user_id, email, full_name, verification_level, created_at')
          .in('user_id', runnerIds)
          .lte('created_at', firstEligibleBefore)
          .not('email', 'is', null)
          .limit(BATCH_LIMIT)

        if (!profiles || profiles.length === 0) {
          return Response.json({ ok: true, runners: runnerIds.length, candidates: 0 })
        }

        const userIds = profiles.map((p) => p.user_id)

        // Academy completion: runner_profiles.certified_at IS NOT NULL
        const { data: runnerProfiles } = await supabaseAdmin
          .from('runner_profiles')
          .select('user_id, certified_at')
          .in('user_id', userIds)
        const academyDone = new Set(
          (runnerProfiles ?? []).filter((r) => r.certified_at).map((r) => r.user_id),
        )

        // Existing reminder records
        const { data: existing } = await supabaseAdmin
          .from('runner_eligibility_reminders')
          .select('user_id, kind, last_sent_at, send_count')
          .in('user_id', userIds)
        const reminderMap = new Map<string, { last_sent_at: string; send_count: number }>()
        for (const r of existing ?? []) {
          reminderMap.set(`${r.user_id}:${r.kind}`, {
            last_sent_at: r.last_sent_at,
            send_count: r.send_count,
          })
        }

        let verificationSent = 0
        let academySent = 0

        for (const p of profiles) {
          const needsVerification = (p.verification_level ?? 0) < 1
          const needsAcademy = !academyDone.has(p.user_id)

          if (needsVerification) {
            if (await maybeSend(p, 'verification', reminderMap, now)) verificationSent++
          }
          if (needsAcademy) {
            if (await maybeSend(p, 'academy', reminderMap, now)) academySent++
          }
        }

        return Response.json({
          ok: true,
          candidates: profiles.length,
          verification_sent: verificationSent,
          academy_sent: academySent,
        })
      },
    },
  },
})

async function maybeSend(
  p: { user_id: string; email: string | null; full_name: string | null },
  kind: Kind,
  reminderMap: Map<string, { last_sent_at: string; send_count: number }>,
  now: number,
): Promise<boolean> {
  if (!p.email) return false
  const existing = reminderMap.get(`${p.user_id}:${kind}`)
  if (existing) {
    const last = new Date(existing.last_sent_at).getTime()
    if (now - last < REPEAT_DELAY_MS) return false
  }

  const templateName =
    kind === 'verification' ? 'verification_reminder' : 'academy_reminder'

  const result = await sendTransactionalEmail({
    templateName,
    recipientEmail: p.email,
    templateData: { recipientName: (p.full_name ?? '').split(' ')[0] || 'there' },
  })

  if (!result.ok && result.reason !== 'suppressed') {
    console.warn('eligibility reminder send failed', {
      user_id: p.user_id,
      kind,
      reason: result.reason,
    })
    return false
  }

  await supabaseAdmin
    .from('runner_eligibility_reminders')
    .upsert(
      {
        user_id: p.user_id,
        kind,
        last_sent_at: new Date(now).toISOString(),
        send_count: (existing?.send_count ?? 0) + 1,
      },
      { onConflict: 'user_id,kind' },
    )

  return result.ok
}