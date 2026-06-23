import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface WelcomeInvestorProps extends Partial<NotificationProps> {
  recipientName?: string
}

export function WelcomeInvestor(props: WelcomeInvestorProps) {
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title="Welcome to REI Runner."
      body="Post your first task in under two minutes. Verified runners in your market will start applying immediately — most tasks get accepted within the hour."
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard/investor'}
      ctaLabel="Post a task"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: WelcomeInvestor,
  subject: 'Welcome to REI Runner — post your first task',
  displayName: 'Welcome — Investor',
  previewData: { recipientName: 'Alex' },
} satisfies TemplateEntry