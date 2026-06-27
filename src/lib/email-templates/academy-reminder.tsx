import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface AcademyReminderProps extends Partial<NotificationProps> {
  recipientName?: string
}

export function AcademyReminder(props: AcademyReminderProps) {
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title="Knock out a few Academy classes — they're quick"
      body="Completing your Academy training is required before you can accept tasks. Most modules take only 5–10 minutes each, and you can finish the core set in a single sitting. Jump back in and check a few off the list — investors are waiting for runners like you."
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard/runner/academy'}
      ctaLabel="Continue Academy"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: AcademyReminder,
  subject: "Finish your REI Runner Academy classes — they're quick",
  displayName: 'Academy completion reminder',
  previewData: { recipientName: 'Jordan' },
} satisfies TemplateEntry