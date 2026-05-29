import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandFooter, BrandHeader, button, card, container, footer, h1, main, text } from './_brand'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <div style={card}>
          <Heading style={h1}>Confirm your new email</Heading>
          <Text style={text}>
            You requested to change your {siteName} email from <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
          </Text>
          <Button style={button} href={confirmationUrl}>Confirm email change</Button>
          <Text style={footer}>
            If you didn't request this change, please secure your account immediately.
          </Text>
        </div>
      </Container>
      <BrandFooter />
    </Body>
  </Html>
)

export default EmailChangeEmail
