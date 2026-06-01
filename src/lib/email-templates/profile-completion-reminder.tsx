import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface ProfileCompletionReminderProps {
  fullName?: string
  role?: 'runner' | 'investor'
  missingSteps?: string[]
  stage?: 'first_nudge' | 'second_nudge'
  ctaUrl?: string
}

const brand = '#e9a23b'
const bg = '#ffffff'
const card = '#fbfaf7'
const text = '#1a1a1d'
const muted = '#5b5b66'
const border = '#ececf0'

export function ProfileCompletionReminder({
  fullName = 'there',
  role = 'runner',
  missingSteps = [],
  stage = 'first_nudge',
  ctaUrl = 'https://reirunner.com/dashboard',
}: ProfileCompletionReminderProps) {
  const firstName = fullName.split(' ')[0] || 'there'
  const isRunner = role === 'runner'
  const headline =
    stage === 'second_nudge'
      ? `${firstName}, your REI Runner profile is still incomplete`
      : `${firstName}, log back in and finish setting up your account`

  return (
    <Html>
      <Head />
      <Preview>
        Finish your REI Runner profile so you're ready when your market goes live.
      </Preview>
      <Body style={{ backgroundColor: bg, color: text, fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
          <Section style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text style={{ color: brand, fontWeight: 700, letterSpacing: 2, fontSize: 12, margin: 0 }}>
              REI RUNNER
            </Text>
          </Section>

          <Section style={{ backgroundColor: card, borderRadius: 16, padding: 32, border: `1px solid ${border}` }}>
            <Heading style={{ color: text, fontSize: 22, margin: '0 0 12px', lineHeight: 1.3 }}>
              {headline}
            </Heading>
            <Text style={{ color: muted, fontSize: 15, lineHeight: 1.65, margin: '0 0 18px' }}>
              Thanks for creating your {isRunner ? 'runner' : 'investor'} account. A few key
              steps are still pending — finishing them now means you'll be ready to{' '}
              {isRunner ? 'claim tasks and get paid' : 'post tasks and hire runners'} the
              moment your market goes live.
            </Text>

            {missingSteps.length > 0 && (
              <>
                <Hr style={{ borderColor: border, margin: '20px 0' }} />
                <Heading as="h2" style={{ color: text, fontSize: 15, margin: '0 0 10px' }}>
                  Still to do
                </Heading>
                <ul style={{ color: text, fontSize: 14, lineHeight: 1.7, paddingLeft: 18, margin: '0 0 18px' }}>
                  {missingSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </>
            )}

            <Section style={{ textAlign: 'center', margin: '20px 0 8px' }}>
              <Button
                href={ctaUrl}
                style={{
                  backgroundColor: brand,
                  color: '#111',
                  padding: '13px 26px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                Log in and finish setup
              </Button>
            </Section>

            <Hr style={{ borderColor: border, margin: '28px 0 18px' }} />

            <Heading as="h2" style={{ color: text, fontSize: 15, margin: '0 0 8px' }}>
              Heads up — we're still in beta
            </Heading>
            <Text style={{ color: muted, fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>
              REI Runner isn't fully live yet. We're onboarding investors and runners in
              waves, market by market. Completing your profile and verification now puts
              you at the front of the line when your area opens up. We'll email you the
              moment it does.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', padding: '20px 0 0' }}>
            <Text style={{ color: muted, fontSize: 12, margin: 0 }}>
              Questions? Reply to this email or call{' '}
              <Link href="tel:+15177749896" style={{ color: muted }}>(517) 774-9896</Link>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ProfileCompletionReminder,
  subject: (data: Record<string, any>) => {
    const name = data?.fullName ? String(data.fullName).split(' ')[0] : ''
    return data?.stage === 'second_nudge'
      ? `${name ? name + ', ' : ''}your REI Runner profile is still incomplete`
      : `${name ? name + ', ' : ''}finish setting up your REI Runner account`
  },
  displayName: 'Profile completion reminder',
  previewData: {
    fullName: 'Jordan Lee',
    role: 'runner',
    stage: 'first_nudge',
    missingSteps: [
      'Add a profile photo',
      'Write a short bio',
      'Upload your government-issued ID for verification',
    ],
    ctaUrl: 'https://reirunner.com/dashboard',
  } satisfies ProfileCompletionReminderProps,
} satisfies TemplateEntry