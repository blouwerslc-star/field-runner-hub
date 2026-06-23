import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface ReEngagementProps extends Partial<NotificationProps> {
  recipientName?: string
  daysAway?: number
}

export function ReEngagement(props: ReEngagementProps) {
  const days = props.daysAway ?? 14
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title={`We miss you — ${days} days and counting`}
      body="A lot has happened on REI Runner since you last signed in. New tasks, new runners, and new markets just opened up. Jump back in to see what's waiting for you."
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard'}
      ctaLabel="Come back to REI Runner"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: ReEngagement,
  subject: 'We saved your spot on REI Runner',
  displayName: 'Re-engagement',
  previewData: { recipientName: 'Sam', daysAway: 14 },
} satisfies TemplateEntry