import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  confirmationUrl: string
}

export const WelcomeEmail = ({ confirmationUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Nomiqa - Your Signal Moves With You</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>NOMIQA</Heading>
          <Text style={tagline}>Your Signal Moves With You</Text>
        </Section>

        <Section style={content}>
          <Heading style={h2}>Welcome, Explorer</Heading>
          
          <Text style={text}>
            You're joining a new class of global citizens who navigate the world by their own rules.
          </Text>

          <Text style={text}>
            Click the button below to confirm your email and activate your account:
          </Text>

          <Link
            href={confirmationUrl}
            target="_blank"
            style={button}
          >
            ACTIVATE YOUR ACCOUNT
          </Link>

          <Text style={textSmall}>
            Or copy and paste this URL into your browser:
          </Text>
          <Text style={linkText}>{confirmationUrl}</Text>

          <Section style={valuesSection}>
            <Text style={valueTitle}>The Explorer Values:</Text>
            <Text style={valueItem}>• Freedom - Go where you feel alive</Text>
            <Text style={valueItem}>• Belonging - You are never out of network</Text>
            <Text style={valueItem}>• Sovereignty - Your identity travels with you</Text>
            <Text style={valueItem}>• Movement - Keep moving. Stay connected.</Text>
          </Section>

          <Text style={textSmall}>
            If you didn't create this account, you can safely ignore this email.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Nomiqa - The Signal of the Moving Class
          </Text>
          <Text style={footerText}>
            © 2025 Nomiqa. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#1a2332', // midnight
  padding: '40px 32px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#36bdc6', // cyan
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
}

const tagline = {
  color: '#d9cbb8', // sand
  fontSize: '14px',
  margin: '8px 0 0 0',
  fontStyle: 'italic',
  letterSpacing: '0.05em',
}

const content = {
  padding: '40px 32px',
}

const h2 = {
  color: '#1a2332',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const textSmall = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#36bdc6',
  borderRadius: '4px',
  color: '#1a2332',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 0',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
}

const linkText = {
  color: '#36bdc6',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
  margin: '8px 0',
}

const valuesSection = {
  backgroundColor: '#f8f9fa',
  padding: '24px',
  margin: '32px 0',
  borderLeft: '4px solid #36bdc6',
}

const valueTitle = {
  color: '#1a2332',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
}

const valueItem = {
  color: '#555555',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
}

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e5e5',
}

const footerText = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '4px 0',
}
