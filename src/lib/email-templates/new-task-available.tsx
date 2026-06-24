import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface NewTaskAvailableProps {
  runnerFirstName?: string
  title: string
  taskType?: string
  city?: string
  state?: string
  payoutAmount?: number | null
  dueDate?: string | null
  description?: string | null
  taskUrl: string
  unsubscribeUrl?: string
}

const brand = '#e9a23b'
const bg = '#0b0b0c'
const card = '#141416'
const text = '#e7e7ea'
const muted = '#9a9aa3'

function formatPayout(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return null
  return `$${Number(n).toFixed(0)}`
}

export function NewTaskAvailable({
  runnerFirstName = 'there',
  title,
  taskType,
  city,
  state,
  payoutAmount,
  dueDate,
  description,
  taskUrl,
  unsubscribeUrl = 'https://reirunner.com/unsubscribe',
}: NewTaskAvailableProps) {
  const payout = formatPayout(payoutAmount)
  const location = [city, state].filter(Boolean).join(', ')
  return (
    <Html>
      <Head />
      <Preview>{title}{location ? ` — ${location}` : ''}</Preview>
      <Body style={{ backgroundColor: bg, color: text, fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
          <Section style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text style={{ color: brand, fontWeight: 700, letterSpacing: 2, fontSize: 12, margin: 0 }}>REI RUNNER</Text>
          </Section>
          <Section style={{ backgroundColor: card, borderRadius: 16, padding: 32, border: '1px solid #232327' }}>
            <Heading style={{ color: text, fontSize: 22, margin: '0 0 12px', lineHeight: 1.3 }}>
              Hi {runnerFirstName.split(' ')[0]}, a new task is available
            </Heading>
            <Text style={{ color: text, fontSize: 16, lineHeight: 1.55, margin: '0 0 8px', fontWeight: 600 }}>{title}</Text>
            <Text style={{ color: muted, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
              {taskType ? <>Type: <span style={{ color: text }}>{taskType}</span><br /></> : null}
              {location ? <>Location: <span style={{ color: text }}>{location}</span><br /></> : null}
              {payout ? <>Payout: <span style={{ color: text }}>{payout}</span><br /></> : null}
              {dueDate ? <>Due: <span style={{ color: text }}>{dueDate}</span></> : null}
            </Text>
            {description && (
              <Text style={{ color: muted, fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>
                {description.length > 280 ? description.slice(0, 280) + '…' : description}
              </Text>
            )}
            <Section style={{ textAlign: 'center', margin: '12px 0 4px' }}>
              <Button href={taskUrl} style={{ backgroundColor: brand, color: '#111', padding: '12px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                View task
              </Button>
            </Section>
            <Hr style={{ borderColor: '#232327', margin: '24px 0 12px' }} />
            <Text style={{ color: muted, fontSize: 12, margin: 0 }}>
              You're receiving this because you opted in to new task alerts. Manage preferences in Settings → Notifications.
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
  component: NewTaskAvailable,
  subject: (data: Record<string, any>) => {
    const loc = [data?.city, data?.state].filter(Boolean).join(', ')
    const payout = formatPayout(data?.payoutAmount)
    const type = data?.taskType || 'task'
    return `New ${type}${loc ? ` in ${loc}` : ''}${payout ? ` — ${payout}` : ''}`
  },
  displayName: 'New task available',
  previewData: {
    runnerFirstName: 'Jordan',
    title: 'Exterior photos — 123 Maple St',
    taskType: 'Property Photos',
    city: 'Austin',
    state: 'TX',
    payoutAmount: 45,
    dueDate: '2026-06-30',
    description: 'Walk the lot and capture front, sides, back, and street view.',
    taskUrl: 'https://reirunner.com/tasks/preview',
    unsubscribeUrl: 'https://reirunner.com/unsubscribe?token=preview',
  } satisfies NewTaskAvailableProps,
} satisfies TemplateEntry