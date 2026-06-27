import * as React from 'react'
import { Notification, type NotificationProps } from './notification'
import type { TemplateEntry } from './registry'

export interface MarketUpdateLaunchProps extends Partial<NotificationProps> {
  recipientName?: string
}

export function MarketUpdateLaunch(props: MarketUpdateLaunchProps) {
  return (
    <Notification
      recipientName={props.recipientName ?? 'there'}
      title="Live tasks are 1–2 months away — finish verification now"
      body="Quick market update: we're on track to open live, paid tasks in your area in the next 1–2 months. To accept any task the moment they go live, you MUST complete your verification before then — runners who aren't verified will not be able to claim tasks. Verification only takes a few minutes, so please knock it out today so you're first in line when work starts flowing."
      ctaUrl={props.ctaUrl ?? 'https://reirunner.com/dashboard/runner/verification'}
      ctaLabel="Finish verification"
      unsubscribeUrl={props.unsubscribeUrl}
    />
  )
}

export const template = {
  component: MarketUpdateLaunch,
  subject: 'Live tasks are 1–2 months away — get verified now',
  displayName: 'Market update: launch countdown',
  previewData: { recipientName: 'Jordan' },
} satisfies TemplateEntry