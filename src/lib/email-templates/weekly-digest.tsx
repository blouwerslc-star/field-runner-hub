import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface WeeklyDigestProps extends Partial<NotificationProps> {
  recipientName?: string
  summary?: string
}

export function WeeklyDigest(props: WeeklyDigestProps) {
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title="Your REI Runner weekly summary"
      body={props.summary ?? 'Here is a quick look at activity on your account this week.'}
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard'}
      ctaLabel="Open dashboard"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: WeeklyDigest,
  subject: 'Your REI Runner weekly summary',
  displayName: 'Weekly Digest',
  previewData: { recipientName: 'Jordan', summary: '3 new tasks in your market • 2 applications • $480 paid out.' },
} satisfies TemplateEntry