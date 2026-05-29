import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandFooter, BrandHeader, button, card, container, footer, h1, main, text } from './_brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <div style={card}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password for {siteName}. Click below to choose a new password.
          </Text>
          <Button style={button} href={confirmationUrl}>Reset password</Button>
          <Text style={footer}>
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </Text>
        </div>
      </Container>
      <BrandFooter />
    </Body>
  </Html>
)

export default RecoveryEmail
