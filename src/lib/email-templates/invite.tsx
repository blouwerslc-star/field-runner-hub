import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandFooter, BrandHeader, button, card, container, footer, h1, main, text } from './_brand'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <div style={card}>
          <Heading style={h1}>You're invited to {siteName}</Heading>
          <Text style={text}>
            Accept the invitation below to create your account and get started.
          </Text>
          <Button style={button} href={confirmationUrl}>Accept invitation</Button>
          <Text style={footer}>
            If you weren't expecting this invitation, you can safely ignore this email.
          </Text>
        </div>
      </Container>
      <BrandFooter />
    </Body>
  </Html>
)

export default InviteEmail
