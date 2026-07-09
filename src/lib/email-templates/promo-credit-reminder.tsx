import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface PromoCreditReminderProps extends Partial<NotificationProps> {
  recipientName?: string
  creditAmount?: string
}

export function PromoCreditReminder(props: PromoCreditReminderProps) {
  const amount = props.creditAmount ?? '$50'
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title={`Your ${amount} First Task Free credit is still waiting`}
      body={`Just a quick reminder — you have a ${amount} credit on your REI Runner account that auto-applies to your first funded task. No code needed. Post a task in your market and we'll take ${amount} off the top at checkout.`}
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard/investor'}
      ctaLabel="Post your first task"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: PromoCreditReminder,
  subject: 'Your $50 First Task Free credit is still available',
  displayName: 'Promo — First Task Free reminder',
  previewData: { recipientName: 'Alex', creditAmount: '$50' },
} satisfies TemplateEntry