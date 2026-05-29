import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandFooter, BrandHeader, button, card, container, footer, h1, main, text } from './_brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <div style={card}>
          <Heading style={h1}>Confirm your email</Heading>
          <Text style={text}>
            Welcome to {siteName}. Confirm <strong>{recipient}</strong> to activate your account and get started.
          </Text>
          <Button style={button} href={confirmationUrl}>Verify email</Button>
          <Text style={footer}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
        </div>
      </Container>
      <BrandFooter />
    </Body>
  </Html>
)

export default SignupEmail
