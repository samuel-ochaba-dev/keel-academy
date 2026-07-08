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

// Brand tokens mirrored from docs/design-system.md. Email clients cannot read
// CSS variables, so the coral + cream are inlined here on purpose.
const coral = '#f76f53'
const cream = '#f2f0e3'
const charcoal = '#2e2e2e'
const muted = '#7a7a72'

export function WelcomeEmail({ name, chapterTitle, chapterUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your first Keelacademy chapter is ready.</Preview>
      <Body
        style={{
          backgroundColor: cream,
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
            <Heading style={{ margin: '0 0 8px', color: charcoal, fontSize: '24px' }}>
              Welcome to Keelacademy, {name}.
            </Heading>
            <Text style={{ color: muted, lineHeight: 1.7, fontSize: '16px' }}>
              You can make things work. This is where you learn to make them hold.
              Start with <strong style={{ color: charcoal }}>{chapterTitle}</strong>,
              then return to your dashboard to confirm your progress was saved.
            </Text>
            <Button
              href={chapterUrl}
              style={{
                backgroundColor: coral,
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
