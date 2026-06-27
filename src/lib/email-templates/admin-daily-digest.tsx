import * as React from 'react'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface DigestItem {
  label: string
  meta?: string
  link?: string
}

export interface DigestSection {
  title: string
  count: number
  items?: DigestItem[]
}

export interface AdminDailyDigestProps {
  dateLabel?: string
  totalEvents?: number
  sections?: DigestSection[]
  unsubscribeUrl?: string
}

const brand = '#e9a23b'
const bg = '#ffffff'
const card = '#ffffff'
const text = '#0F172A'
const muted = '#64748B'
const border = '#E2E8F0'

export function AdminDailyDigest({
  dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  totalEvents = 0,
  sections = [],
  unsubscribeUrl = 'https://reirunner.com/unsubscribe',
}: AdminDailyDigestProps) {
  return (
    <Html>
      <Head />
      <Preview>{`REI Runner daily digest — ${totalEvents} new event${totalEvents === 1 ? '' : 's'}`}</Preview>
      <Body style={{ backgroundColor: bg, color: text, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>
          <Section style={{ marginBottom: 20 }}>
            <Text style={{ color: brand, fontWeight: 800, letterSpacing: 3, fontSize: 12, margin: 0 }}>REI RUNNER · ADMIN DIGEST</Text>
            <Heading style={{ color: text, fontSize: 24, margin: '8px 0 4px' }}>{dateLabel}</Heading>
            <Text style={{ color: muted, fontSize: 14, margin: 0 }}>
              {`${totalEvents} new event${totalEvents === 1 ? '' : 's'} in the last 24 hours`}
            </Text>
          </Section>

          {sections.map((s) => (
            <Section
              key={s.title}
              style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 14 }}
            >
              <Text style={{ color: text, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
                {`${s.title} · ${s.count}`}
              </Text>
              {s.items && s.items.length > 0 && (
                <>
                  <Hr style={{ borderColor: border, margin: '12px 0' }} />
                  {s.items.slice(0, 10).map((it, idx) => (
                    <Text
                      key={idx}
                      style={{ color: text, fontSize: 13, lineHeight: 1.55, margin: '0 0 4px' }}
                    >
                      {it.link ? (
                        <Link href={it.link} style={{ color: brand, textDecoration: 'none' }}>
                          {it.label}
                        </Link>
                      ) : (
                        it.label
                      )}
                      {it.meta && <span style={{ color: muted }}> — {it.meta}</span>}
                    </Text>
                  ))}
                  {s.count > 10 && (
                    <Text style={{ color: muted, fontSize: 12, margin: '6px 0 0', fontStyle: 'italic' }}>
                      {`…and ${s.count - 10} more`}
                    </Text>
                  )}
                </>
              )}
            </Section>
          ))}

          <Section style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <Text style={{ color: muted, fontSize: 11, margin: 0 }}>
              Internal admin digest · <Link href={unsubscribeUrl} style={{ color: muted }}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminDailyDigest,
  subject: (data: Record<string, any>) =>
    `REI Runner digest — ${data?.totalEvents ?? 0} event${(data?.totalEvents ?? 0) === 1 ? '' : 's'} (last 24h)`,
  displayName: 'Admin daily digest',
  to: 'blouwerslc@gmail.com',
  previewData: {
    dateLabel: 'Saturday, June 27',
    totalEvents: 7,
    sections: [
      { title: 'Signups & applications', count: 3, items: [
        { label: 'Jordan Lee (runner)', meta: '2h ago' },
        { label: 'Acme Capital (investor)', meta: '5h ago' },
        { label: 'Field runner application — Sarah K.', meta: '9h ago' },
      ]},
      { title: 'Verification & academy', count: 2, items: [
        { label: 'Background check paid — Jordan Lee', meta: '1h ago' },
        { label: 'Academy certified — Mike R.', meta: '6h ago' },
      ]},
      { title: 'Task lifecycle', count: 1, items: [
        { label: 'Task posted: Drive-by inspection — Dallas, TX', meta: '4h ago' },
      ]},
      { title: 'Money & support', count: 1, items: [
        { label: 'Support request from Acme Capital', meta: '30m ago' },
      ]},
    ],
  } satisfies AdminDailyDigestProps,
} satisfies TemplateEntry