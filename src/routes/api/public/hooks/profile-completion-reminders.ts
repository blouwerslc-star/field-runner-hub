import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTransactionalEmail } from '@/lib/email-sender.server'

/**
 * Hourly cron: nudge users with incomplete profiles to log back in.
 *
 * Stage 1 ("first_nudge"): sent 24h–14d after signup, if profile is incomplete.
 * Stage 2 ("second_nudge"): sent 72h+ after the first nudge, only if still incomplete.
 *
 * Dedup is enforced via `profile_completion_emails` (unique on user_id+stage).
 * Each pass is bounded (BATCH_LIMIT) so a backlog drains gradually instead of
 * spamming the queue.
 */

const BATCH_LIMIT = 100
const PUBLIC_BASE_URL = 'https://reirunner.com'

type Profile = {
  user_id: string
  email: string | null
  full_name: string | null
  profile_photo_url: string | null
  bio: string | null
  city: string | null
  state: string | null
  company_name: string | null
  company_description: string | null
  verification_level: number | null
  created_at: string
}

function missingStepsFor(role: 'runner' | 'investor', p: Profile, hasId: boolean): string[] {
  const steps: string[] = []
  if (!p.profile_photo_url) steps.push('Add a profile photo')
  if (!p.city || !p.state) steps.push('Add your city and state')
  if (role === 'runner') {
    if (!p.bio) steps.push('Write a short bio describing your experience')
    if (!hasId) steps.push('Upload your government-issued ID for verification')
    if ((p.verification_level ?? 0) < 1) steps.push('Complete identity verification')
  } else {
    if (!p.company_name) steps.push('Add your company name')
    if (!p.company_description) steps.push('Add a short company description')
  }
  return steps
}

export const Route = createFileRoute('/api/public/hooks/profile-completion-reminders')({
  server: {
    handlers: {
      POST: async () => {
        const now = Date.now()
        const day = 24 * 60 * 60 * 1000
        const stage1WindowStart = new Date(now - 14 * day).toISOString()
        const stage1WindowEnd = new Date(now - 1 * day).toISOString()
        const stage2MinAge = new Date(now - 3 * day).toISOString()

        // ---------- Stage 1: first nudge ----------
        const { data: candidates1 } = await supabaseAdmin
          .from('profiles')
          .select(
            'user_id, email, full_name, profile_photo_url, bio, city, state, company_name, company_description, verification_level, created_at',
          )
          .gte('created_at', stage1WindowStart)
          .lte('created_at', stage1WindowEnd)
          .limit(BATCH_LIMIT)

        const stage1Sent: string[] = []
        const stage1Skipped: string[] = []

        for (const p of (candidates1 ?? []) as Profile[]) {
          if (!p.email) continue
          // Skip if first nudge already sent
          const { data: already } = await supabaseAdmin
            .from('profile_completion_emails')
            .select('id')
            .eq('user_id', p.user_id)
            .eq('stage', 'first_nudge')
            .maybeSingle()
          if (already) {
            stage1Skipped.push(p.user_id)
            continue
          }
          await tryNudge(p, 'first_nudge', stage1Sent)
        }

        // ---------- Stage 2: follow-up nudge ----------
        const { data: firstNudges } = await supabaseAdmin
          .from('profile_completion_emails')
          .select('user_id, sent_at')
          .eq('stage', 'first_nudge')
          .lte('sent_at', stage2MinAge)
          .limit(BATCH_LIMIT)

        const stage2Sent: string[] = []
        for (const row of firstNudges ?? []) {
          // Skip if second nudge already sent
          const { data: already } = await supabaseAdmin
            .from('profile_completion_emails')
            .select('id')
            .eq('user_id', row.user_id)
            .eq('stage', 'second_nudge')
            .maybeSingle()
          if (already) continue

          const { data: p } = await supabaseAdmin
            .from('profiles')
            .select(
              'user_id, email, full_name, profile_photo_url, bio, city, state, company_name, company_description, verification_level, created_at',
            )
            .eq('user_id', row.user_id)
            .maybeSingle()
          if (!p?.email) continue

          await tryNudge(p as Profile, 'second_nudge', stage2Sent)
        }

        return Response.json({
          ok: true,
          stage1_candidates: candidates1?.length ?? 0,
          stage1_sent: stage1Sent.length,
          stage1_skipped: stage1Skipped.length,
          stage2_candidates: firstNudges?.length ?? 0,
          stage2_sent: stage2Sent.length,
        })
      },
    },
  },
})

async function tryNudge(
  p: Profile,
  stage: 'first_nudge' | 'second_nudge',
  sentBucket: string[],
) {
  // Resolve role
  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', p.user_id)
  const roleList = (roles ?? []).map((r) => r.role)
  const role: 'runner' | 'investor' = roleList.includes('runner') ? 'runner' : 'investor'

  // Has uploaded ID?
  const { data: idFiles } = await supabaseAdmin
    .from('task_files')
    .select('id')
    .eq('uploader_id', p.user_id)
    .eq('bucket', 'runner-ids')
    .limit(1)
  const hasId = (idFiles ?? []).length > 0

  const steps = missingStepsFor(role, p, hasId)
  if (steps.length === 0) {
    // Profile complete — record stage as "sent" to avoid future scanning, but don't email.
    await supabaseAdmin
      .from('profile_completion_emails')
      .insert({ user_id: p.user_id, stage })
      .select('id')
      .maybeSingle()
    return
  }

  const ctaUrl =
    role === 'runner'
      ? `${PUBLIC_BASE_URL}/profile/verification`
      : `${PUBLIC_BASE_URL}/profile/edit`

  const result = await sendTransactionalEmail({
    templateName: 'profile_completion_reminder',
    recipientEmail: p.email!,
    templateData: {
      fullName: p.full_name ?? 'there',
      role,
      stage,
      missingSteps: steps,
      ctaUrl,
    },
  })

  // Record stage attempt regardless of whether queueing succeeded if suppressed,
  // to prevent infinite retries against an unreachable address.
  if (result.ok || result.reason === 'suppressed') {
    await supabaseAdmin
      .from('profile_completion_emails')
      .insert({ user_id: p.user_id, stage })
    if (result.ok) sentBucket.push(p.user_id)
  } else {
    console.warn('profile reminder send failed', {
      user_id: p.user_id,
      stage,
      reason: result.reason,
    })
  }
}