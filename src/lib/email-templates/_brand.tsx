import * as React from 'react'
import { Container, Section, Text, Hr } from '@react-email/components'

export const brand = {
  accent: '#2D7FF9',
  accentDark: '#1E5FCC',
  navy: '#0B1A33',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#ffffff',
  surface: '#F8FAFC',
}

export const main = {
  backgroundColor: brand.bg,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: 0,
}

export const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0',
}

export const card = {
  backgroundColor: brand.bg,
  border: `1px solid ${brand.border}`,
  borderRadius: '12px',
  padding: '32px 32px 28px',
  margin: '0 20px',
}

export const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: brand.text,
  margin: '0 0 16px',
  lineHeight: 1.25,
}

export const text = {
  fontSize: '15px',
  color: brand.text,
  lineHeight: 1.6,
  margin: '0 0 20px',
}

export const link = {
  color: brand.accent,
  textDecoration: 'underline',
}

export const button = {
  backgroundColor: brand.accent,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '8px',
  padding: '13px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const footer = {
  fontSize: '12px',
  color: brand.muted,
  lineHeight: 1.5,
  margin: '24px 0 0',
}

export const code = {
  display: 'inline-block',
  padding: '14px 20px',
  backgroundColor: brand.surface,
  border: `1px solid ${brand.border}`,
  borderRadius: '8px',
  fontFamily: "'SF Mono', Menlo, Consolas, monospace",
  fontSize: '24px',
  fontWeight: 700 as const,
  letterSpacing: '6px',
  color: brand.text,
}

export function BrandHeader() {
  return (
    <Section style={{ padding: '32px 20px 20px', textAlign: 'center' as const }}>
      <Text
        style={{
          fontSize: '13px',
          fontWeight: 800 as const,
          letterSpacing: '3px',
          color: brand.accent,
          margin: 0,
        }}
      >
        REI RUNNER
      </Text>
    </Section>
  )
}

export function BrandFooter() {
  return (
    <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px 32px' }}>
      <Hr style={{ borderColor: brand.border, margin: '0 0 16px' }} />
      <Text style={{ fontSize: '12px', color: brand.muted, margin: 0, textAlign: 'center' as const }}>
        REI Runner · Real estate field services marketplace
      </Text>
      <Text style={{ fontSize: '11px', color: brand.muted, margin: '6px 0 0', textAlign: 'center' as const }}>
        reirunner.com
      </Text>
    </Container>
  )
}