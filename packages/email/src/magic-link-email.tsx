import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { render } from '@react-email/render'

export type MagicLinkEmailProps = {
  url: string
  host: string
}

// Brand tokens mirrored from the "cool slate + indigo" palette. Email clients
// cannot read CSS variables, so the hex is inlined here on purpose — keep it in
// sync with apps/web/app/globals.css :root (see welcome-email.tsx).
const indigo = '#505ac8' // --primary          oklch(0.520 0.170 275)
const paper = '#f7f9fc' // --background        oklch(0.982 0.004 250)
const ink = '#2a2e34' // --foreground        oklch(0.300 0.012 260)
const muted = '#52575d' // --muted-foreground  oklch(0.455 0.012 255)

export function MagicLinkEmail({ url, host }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Keelacademy sign-in link (expires in 30 minutes)</Preview>
      <Body
        style={{
          backgroundColor: paper,
          fontFamily: 'Georgia, "Times New Roman", serif',
          margin: 0,
          padding: '32px 0',
        }}
      >
        <Container
          style={{
            maxWidth: '540px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '40px',
          }}
        >
          <Section>
            <Heading style={{ margin: '0 0 8px', color: ink, fontSize: '24px' }}>
              Sign in to Keelacademy
            </Heading>
            <Text style={{ color: muted, lineHeight: 1.7, fontSize: '16px' }}>
              Click the button below to finish signing in to{' '}
              <strong style={{ color: ink }}>{host}</strong>. This link expires
              in 30 minutes and can only be used once.
            </Text>
            <Button
              href={url}
              style={{
                backgroundColor: indigo,
                color: '#ffffff',
                padding: '14px 22px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                display: 'inline-block',
                marginTop: '12px',
              }}
            >
              Sign in
            </Button>
            <Text style={{ color: muted, lineHeight: 1.7, fontSize: '13px', marginTop: '28px' }}>
              Or paste this link into your browser:
              <br />
              <Link href={url} style={{ color: indigo, wordBreak: 'break-all' }}>
                {url}
              </Link>
            </Text>
            <Text style={{ color: muted, lineHeight: 1.7, fontSize: '13px', marginTop: '20px' }}>
              If you didn&rsquo;t request this email, you can safely ignore it —
              no one can sign in without the link.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderMagicLinkEmail(
  props: MagicLinkEmailProps,
): Promise<string> {
  return render(<MagicLinkEmail {...props} />)
}
