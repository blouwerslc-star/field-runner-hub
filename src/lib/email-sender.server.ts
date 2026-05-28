import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from './email-templates/registry'

const SITE_NAME = 'REI Runner'
const SENDER_DOMAIN = 'notify.reirunner.com'
const FROM_DOMAIN = 'notify.reirunner.com'
const PUBLIC_BASE_URL = 'https://reirunner.com'

function redact(email: string) {
  const [l, d] = email.split('@')
  if (!l || !d) return '***'
  return `${l[0]}***@${d}`
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Render a registered template and enqueue it to the transactional email queue.
 * Server-side only. Safe to call from server functions where the caller is not
 * an authenticated user (e.g. public application submissions).
 */
export async function sendTransactionalEmail(opts: {
  templateName: string
  recipientEmail: string
  templateData?: Record<string, unknown>
}): Promise<{ ok: boolean; reason?: string }> {
  const { templateName, recipientEmail } = opts
  const template = TEMPLATES[templateName]
  if (!template) {
    console.error('Unknown email template', { templateName })
    return { ok: false, reason: 'unknown_template' }
  }
  const to = (template.to || recipientEmail || '').trim()
  if (!to) return { ok: false, reason: 'missing_recipient' }
  const normalized = to.toLowerCase()
  const messageId = crypto.randomUUID()

  try {
    // Suppression check
    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id')
      .eq('email', normalized)
      .maybeSingle()
    if (suppressed) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: to,
        status: 'suppressed',
      })
      return { ok: false, reason: 'suppressed' }
    }

    // Unsubscribe token (one per email)
    let unsubscribeToken: string
    const { data: existing } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token, used_at')
      .eq('email', normalized)
      .maybeSingle()
    if (existing && !existing.used_at) {
      unsubscribeToken = existing.token
    } else {
      unsubscribeToken = generateToken()
      await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .upsert(
          { token: unsubscribeToken, email: normalized },
          { onConflict: 'email', ignoreDuplicates: true },
        )
      const { data: stored } = await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', normalized)
        .maybeSingle()
      if (stored?.token) unsubscribeToken = stored.token
    }

    const unsubscribeUrl = `${PUBLIC_BASE_URL}/unsubscribe?token=${unsubscribeToken}`
    const data = { ...(opts.templateData || {}), unsubscribeUrl }
    const element = React.createElement(template.component, data)
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject =
      typeof template.subject === 'function' ? template.subject(data) : template.subject

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: to,
      status: 'pending',
    })

    const { error: enqErr } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: messageId,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })
    if (enqErr) {
      console.error('enqueue failed', { templateName, recipient: redact(to), enqErr })
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: to,
        status: 'failed',
        error_message: 'enqueue_failed',
      })
      return { ok: false, reason: 'enqueue_failed' }
    }
    return { ok: true }
  } catch (err) {
    console.error('sendTransactionalEmail crashed', { templateName, recipient: redact(to), err })
    return { ok: false, reason: 'exception' }
  }
}