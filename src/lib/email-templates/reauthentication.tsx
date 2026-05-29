import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandFooter, BrandHeader, card, code, container, footer, h1, main, text } from './_brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your REI Runner verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <div style={card}>
          <Heading style={h1}>Confirm it's you</Heading>
          <Text style={text}>Use the code below to confirm your identity:</Text>
          <Text style={code}>{token}</Text>
          <Text style={footer}>
            This code expires shortly. If you didn't request this, you can safely ignore this email.
          </Text>
        </div>
      </Container>
      <BrandFooter />
    </Body>
  </Html>
)

export default ReauthenticationEmail
