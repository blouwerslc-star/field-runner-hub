import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface WelcomeRunnerProps extends Partial<NotificationProps> {
  recipientName?: string
}

export function WelcomeRunner(props: WelcomeRunnerProps) {
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title="Welcome to REI Runner — you're in."
      body="Real estate investors are posting paid field tasks every day. Complete your profile, finish a couple of Academy modules, and you'll start showing up to investors near you."
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard/runner'}
      ctaLabel="Open runner dashboard"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: WelcomeRunner,
  subject: "Welcome to REI Runner — let's get you your first task",
  displayName: 'Welcome — Runner',
  previewData: { recipientName: 'Jordan' },
} satisfies TemplateEntry