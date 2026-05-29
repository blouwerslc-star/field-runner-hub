import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface NotificationProps {
  recipientName?: string
  title: string
  body?: string
  ctaUrl?: string
  ctaLabel?: string
  unsubscribeUrl?: string
}

const brand = '#e9a23b'
const bg = '#0b0b0c'
const card = '#141416'
const text = '#e7e7ea'
const muted = '#9a9aa3'

export function Notification({
  recipientName = 'there',
  title,
  body,
  ctaUrl,
  ctaLabel = 'Open REI Runner',
  unsubscribeUrl = 'https://reirunner.com/unsubscribe',
}: NotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={{ backgroundColor: bg, color: text, fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
          <Section style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text style={{ color: brand, fontWeight: 700, letterSpacing: 2, fontSize: 12, margin: 0 }}>REI RUNNER</Text>
          </Section>
          <Section style={{ backgroundColor: card, borderRadius: 16, padding: 32, border: '1px solid #232327' }}>
            <Heading style={{ color: text, fontSize: 22, margin: '0 0 12px', lineHeight: 1.3 }}>
              Hi {recipientName.split(' ')[0]},
            </Heading>
            <Text style={{ color: text, fontSize: 16, lineHeight: 1.55, margin: '0 0 8px', fontWeight: 600 }}>{title}</Text>
            {body && (
              <Text style={{ color: muted, fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>{body}</Text>
            )}
            {ctaUrl && (
              <Section style={{ textAlign: 'center', margin: '12px 0 4px' }}>
                <Button href={ctaUrl} style={{ backgroundColor: brand, color: '#111', padding: '12px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  {ctaLabel}
                </Button>
              </Section>
            )}
            <Hr style={{ borderColor: '#232327', margin: '24px 0 12px' }} />
            <Text style={{ color: muted, fontSize: 12, margin: 0 }}>
              You're receiving this because you have an active REI Runner account.
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <Text style={{ color: muted, fontSize: 11, margin: 0 }}>
              <Link href={unsubscribeUrl} style={{ color: muted, textDecoration: 'underline' }}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Notification,
  subject: (data: Record<string, any>) => String(data?.title ?? 'New activity on REI Runner'),
  displayName: 'Notification',
  previewData: {
    recipientName: 'Jordan Lee',
    title: 'New message from Sarah',
    body: 'Hey — quick question about the property photos…',
    ctaUrl: 'https://reirunner.com/messages',
    ctaLabel: 'View message',
    unsubscribeUrl: 'https://reirunner.com/unsubscribe?token=preview',
  } satisfies NotificationProps,
} satisfies TemplateEntry