import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandFooter, BrandHeader, button, card, container, footer, h1, main, text } from './_brand'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <div style={card}>
          <Heading style={h1}>Your login link</Heading>
          <Text style={text}>
            Click the button below to sign in to {siteName}. This link expires shortly.
          </Text>
          <Button style={button} href={confirmationUrl}>Sign in</Button>
          <Text style={footer}>
            If you didn't request this link, you can safely ignore this email.
          </Text>
        </div>
      </Container>
      <BrandFooter />
    </Body>
  </Html>
)

export default MagicLinkEmail
