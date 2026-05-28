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

export interface ApplicantWelcomeProps {
  fullName?: string
  role?: 'runner' | 'investor'
  signupUrl?: string
  unsubscribeUrl?: string
}

const brand = '#e9a23b'
const bg = '#0b0b0c'
const card = '#141416'
const text = '#e7e7ea'
const muted = '#9a9aa3'

export function ApplicantWelcome({
  fullName = 'there',
  role = 'runner',
  signupUrl = 'https://reirunner.com/signup',
  unsubscribeUrl = 'https://reirunner.com/unsubscribe',
}: ApplicantWelcomeProps) {
  const isRunner = role === 'runner'
  return (
    <Html>
      <Head />
      <Preview>
        Your REI Runner application is in — create your account so you're ready when we launch.
      </Preview>
      <Body style={{ backgroundColor: bg, color: text, fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
          <Section style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text style={{ color: brand, fontWeight: 700, letterSpacing: 2, fontSize: 12, margin: 0 }}>
              REI RUNNER
            </Text>
          </Section>

          <Section style={{ backgroundColor: card, borderRadius: 16, padding: 32, border: '1px solid #232327' }}>
            <Heading style={{ color: text, fontSize: 24, margin: '0 0 12px', lineHeight: 1.25 }}>
              We got your application, {fullName.split(' ')[0]} 🎉
            </Heading>
            <Text style={{ color: muted, fontSize: 15, lineHeight: 1.6, margin: '0 0 20px' }}>
              Thanks for applying to REI Runner as {isRunner ? 'a Founding Runner' : 'an investor'}. You've
              been added to our early access list.
            </Text>

            <Hr style={{ borderColor: '#232327', margin: '24px 0' }} />

            <Heading as="h2" style={{ color: text, fontSize: 17, margin: '0 0 8px' }}>
              Next step: create your account
            </Heading>
            <Text style={{ color: muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
              If you haven't already, set up your login now so you're ready to claim {isRunner ? 'tasks' : 'runners'} the
              moment your access opens.
            </Text>
            <Section style={{ textAlign: 'center', margin: '8px 0 4px' }}>
              <Button
                href={signupUrl}
                style={{
                  backgroundColor: brand,
                  color: '#111',
                  padding: '12px 22px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                Create your account
              </Button>
            </Section>

            <Hr style={{ borderColor: '#232327', margin: '28px 0 20px' }} />

            <Heading as="h2" style={{ color: text, fontSize: 17, margin: '0 0 8px' }}>
              A quick heads up
            </Heading>
            <Text style={{ color: muted, fontSize: 14, lineHeight: 1.65, margin: '0 0 12px' }}>
              We're still in the early phases and haven't officially launched yet. We're rolling out access in
              waves as we onboard {isRunner ? 'investors and tasks' : 'runners'} in each market.
            </Text>
            <Text style={{ color: muted, fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              Hang tight and keep an eye on your inbox — we'll email you with next steps, launch updates,
              and your first opportunities as soon as your area goes live.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <Text style={{ color: muted, fontSize: 12, margin: 0 }}>
              REI Runner · Real estate field services marketplace
            </Text>
            <Text style={{ color: muted, fontSize: 11, margin: '8px 0 0' }}>
              <Link href={unsubscribeUrl} style={{ color: muted, textDecoration: 'underline' }}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ApplicantWelcome,
  subject: (data: Record<string, any>) =>
    `Welcome to REI Runner${data?.fullName ? ', ' + String(data.fullName).split(' ')[0] : ''} — create your account`,
  displayName: 'Applicant welcome',
  previewData: {
    fullName: 'Jordan Lee',
    role: 'runner',
    signupUrl: 'https://reirunner.com/signup?role=runner',
    unsubscribeUrl: 'https://reirunner.com/unsubscribe?token=preview',
  } satisfies ApplicantWelcomeProps,
} satisfies TemplateEntry