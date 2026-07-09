import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { render } from '@react-email/render'

export type WelcomeEmailProps = {
  name: string
  chapterTitle: string
  chapterUrl: string
}

// Brand tokens mirrored from the "cool slate + indigo" palette. Email clients
// cannot read CSS variables, so the hex is inlined here on purpose — keep it in
// sync with apps/web/app/globals.css :root.
const indigo = '#505ac8' // --primary          oklch(0.520 0.170 275)
const paper = '#f7f9fc' // --background        oklch(0.982 0.004 250)
const ink = '#2a2e34' // --foreground        oklch(0.300 0.012 260)
const muted = '#52575d' // --muted-foreground  oklch(0.455 0.012 255)

export function WelcomeEmail({ name, chapterTitle, chapterUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your first Keelacademy chapter is ready.</Preview>
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
              Welcome to Keelacademy, {name}.
            </Heading>
            <Text style={{ color: muted, lineHeight: 1.7, fontSize: '16px' }}>
              You can make things work. This is where you learn to make them hold.
              Start with <strong style={{ color: ink }}>{chapterTitle}</strong>,
              then return to your dashboard to confirm your progress was saved.
            </Text>
            <Button
              href={chapterUrl}
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
              Read the first chapter
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderWelcomeEmail(props: WelcomeEmailProps): Promise<string> {
  return render(<WelcomeEmail {...props} />)
}
