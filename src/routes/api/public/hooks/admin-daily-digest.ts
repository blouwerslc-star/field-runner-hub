import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTransactionalEmail } from '@/lib/email-sender.server'

/**
 * Daily admin digest — summarizes activity from the last 24 hours and emails
 * blouwerslc@gmail.com. Scheduled by pg_cron at 13:00 UTC (~8am Central).
 */

const RECIPIENT = 'blouwerslc@gmail.com'
const SITE = 'https://reirunner.com'

interface Item {
  label: string
  meta?: string
  link?: string
}
interface SectionData {
  title: string
  count: number
  items: Item[]
}

function ago(iso: string | null | undefined, now: number): string {
  if (!iso) return ''
  const diff = now - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) {
    const m = Math.max(1, Math.floor(diff / 60_000))
    return `${m}m ago`
  }
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const Route = createFileRoute('/api/public/hooks/admin-daily-digest')({
  server: {
    handlers: {
      POST: async () => {
        const now = Date.now()
        const sinceIso = new Date(now - 24 * 60 * 60 * 1000).toISOString()
        const sb = supabaseAdmin as any

        // --- Signups & applications ---
        const [{ data: newProfiles }, { data: roleRows }, { data: applications }] =
          await Promise.all([
            sb
              .from('profiles')
              .select('user_id, full_name, email, created_at')
              .gte('created_at', sinceIso)
              .order('created_at', { ascending: false })
              .limit(50),
            sb.from('user_roles').select('user_id, role'),
            sb
              .from('field_runner_applications')
              .select('id, full_name, email, created_at')
              .gte('created_at', sinceIso)
              .order('created_at', { ascending: false })
              .limit(50),
          ])

        const roleMap = new Map<string, string>()
        for (const r of roleRows ?? []) {
          if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role)
        }

        const signupItems: Item[] = (newProfiles ?? []).map((p: any) => ({
          label: `${p.full_name || p.email || 'New user'} (${roleMap.get(p.user_id) ?? 'member'})`,
          meta: ago(p.created_at, now),
        }))
        for (const a of applications ?? []) {
          signupItems.push({
            label: `Runner application — ${a.full_name || a.email || 'Anonymous'}`,
            meta: ago(a.created_at, now),
            link: `${SITE}/admin/applications`,
          })
        }

        // --- Verification & academy ---
        const verItems: Item[] = []
        const [
          { data: bgPaid },
          { data: idDocs },
          { data: verReqs },
          { data: certified },
        ] = await Promise.all([
          sb
            .from('profiles')
            .select('user_id, full_name, email, background_check_paid_at')
            .gte('background_check_paid_at', sinceIso)
            .limit(50),
          sb
            .from('runner_id_documents')
            .select('id, user_id, created_at')
            .gte('created_at', sinceIso)
            .limit(50),
          sb
            .from('verification_requests')
            .select('id, user_id, status, created_at, updated_at')
            .or(`created_at.gte.${sinceIso},updated_at.gte.${sinceIso}`)
            .order('updated_at', { ascending: false })
            .limit(50),
          sb
            .from('runner_profiles')
            .select('user_id, certified_at')
            .gte('certified_at', sinceIso)
            .limit(50),
        ])

        const nameFor = async (userId: string): Promise<string> => {
          const { data } = await sb
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', userId)
            .maybeSingle()
          return data?.full_name || data?.email || userId.slice(0, 8)
        }

        for (const p of bgPaid ?? []) {
          verItems.push({
            label: `Background check paid — ${p.full_name || p.email || 'Runner'}`,
            meta: ago(p.background_check_paid_at, now),
            link: `${SITE}/admin/background-checks`,
          })
        }
        for (const d of idDocs ?? []) {
          verItems.push({
            label: `ID document uploaded — ${await nameFor(d.user_id)}`,
            meta: ago(d.created_at, now),
            link: `${SITE}/admin/verification`,
          })
        }
        for (const v of verReqs ?? []) {
          verItems.push({
            label: `Verification ${v.status || 'updated'} — ${await nameFor(v.user_id)}`,
            meta: ago(v.updated_at || v.created_at, now),
            link: `${SITE}/admin/verification`,
          })
        }
        for (const c of certified ?? []) {
          verItems.push({
            label: `Academy certified — ${await nameFor(c.user_id)}`,
            meta: ago(c.certified_at, now),
          })
        }

        // --- Task lifecycle ---
        const taskItems: Item[] = []
        const [{ data: newTasks }, { data: taskEvents }] = await Promise.all([
          sb
            .from('tasks')
            .select('id, title, city, state, status, created_at')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(50),
          sb
            .from('task_status_events')
            .select('id, task_id, event_code, created_at')
            .gte('created_at', sinceIso)
            .in('event_code', ['assigned', 'submitted', 'completed', 'verified', 'cancelled'])
            .order('created_at', { ascending: false })
            .limit(50),
        ])
        for (const t of newTasks ?? []) {
          const loc = [t.city, t.state].filter(Boolean).join(', ')
          taskItems.push({
            label: `Task posted: ${t.title}${loc ? ` — ${loc}` : ''}`,
            meta: ago(t.created_at, now),
            link: `${SITE}/tasks/${t.id}`,
          })
        }
        for (const e of taskEvents ?? []) {
          taskItems.push({
            label: `Task ${e.event_code}`,
            meta: ago(e.created_at, now),
            link: `${SITE}/tasks/${e.task_id}`,
          })
        }

        // --- Money & support ---
        const moneyItems: Item[] = []
        const [
          { data: pays },
          { data: payouts },
          { data: support },
          { data: reports },
          { data: disputes },
        ] = await Promise.all([
          sb
            .from('payments')
            .select('id, amount_cents, status, created_at, task_id')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(50),
          sb
            .from('payout_requests')
            .select('id, amount_cents, status, created_at, user_id')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(50),
          sb
            .from('support_requests')
            .select('id, subject, created_at, user_id')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(50),
          sb
            .from('reports')
            .select('id, reason, created_at')
            .gte('created_at', sinceIso)
            .limit(50),
          sb
            .from('disputes')
            .select('id, reason, status, created_at')
            .gte('created_at', sinceIso)
            .limit(50),
        ])

        for (const p of pays ?? []) {
          moneyItems.push({
            label: `Payment ${p.status} — $${((p.amount_cents ?? 0) / 100).toFixed(2)}`,
            meta: ago(p.created_at, now),
          })
        }
        for (const r of payouts ?? []) {
          moneyItems.push({
            label: `Payout request ${r.status} — $${((r.amount_cents ?? 0) / 100).toFixed(2)}`,
            meta: ago(r.created_at, now),
            link: `${SITE}/admin/payouts`,
          })
        }
        for (const s of support ?? []) {
          moneyItems.push({
            label: `Support: ${s.subject || 'New request'}`,
            meta: ago(s.created_at, now),
            link: `${SITE}/admin/support`,
          })
        }
        for (const r of reports ?? []) {
          moneyItems.push({
            label: `Report filed: ${r.reason || 'see admin'}`,
            meta: ago(r.created_at, now),
            link: `${SITE}/admin/reports`,
          })
        }
        for (const d of disputes ?? []) {
          moneyItems.push({
            label: `Dispute ${d.status || 'opened'}: ${d.reason || ''}`.trim(),
            meta: ago(d.created_at, now),
          })
        }

        const sections: SectionData[] = [
          { title: 'Signups & applications', count: signupItems.length, items: signupItems },
          { title: 'Verification & academy', count: verItems.length, items: verItems },
          { title: 'Task lifecycle', count: taskItems.length, items: taskItems },
          { title: 'Money & support', count: moneyItems.length, items: moneyItems },
        ].filter((s) => s.count > 0)

        const totalEvents = sections.reduce((acc, s) => acc + s.count, 0)

        if (totalEvents === 0) {
          return Response.json({ ok: true, totalEvents: 0, skipped: 'no activity' })
        }

        const dateLabel = new Date(now).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })

        const result = await sendTransactionalEmail({
          templateName: 'admin_daily_digest',
          recipientEmail: RECIPIENT,
          templateData: { dateLabel, totalEvents, sections },
        })

        return Response.json({
          ok: result.ok,
          totalEvents,
          reason: result.reason,
          sections: sections.map((s) => ({ title: s.title, count: s.count })),
        })
      },
    },
  },
})