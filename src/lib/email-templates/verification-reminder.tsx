import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface VerificationReminderProps extends Partial<NotificationProps> {
  recipientName?: string
}

export function VerificationReminder(props: VerificationReminderProps) {
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title="Finish verification to start accepting tasks"
      body="You're almost ready to run paid tasks for real estate investors. Verification is required before you can accept any task — it usually takes just a few minutes. Upload your ID and confirm your details to unlock the task board."
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard/runner/verification'}
      ctaLabel="Get verified"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: VerificationReminder,
  subject: 'Finish verification to start accepting REI Runner tasks',
  displayName: 'Verification reminder',
  previewData: { recipientName: 'Jordan' },
} satisfies TemplateEntry