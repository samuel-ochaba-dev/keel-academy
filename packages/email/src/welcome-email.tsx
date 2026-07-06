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
} from "@react-email/components";
import { render } from "@react-email/render";

export type WelcomeEmailProps = {
  name: string;
  chapterTitle: string;
  chapterUrl: string;
};

export function WelcomeEmail({
  name,
  chapterTitle,
  chapterUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your first Keel Academy chapter is ready.</Preview>
      <Body
        style={{
          backgroundColor: "#f5f1e8",
          fontFamily: "Arial, sans-serif",
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          <Section>
            <Heading style={{ margin: 0 }}>Welcome to Keel Academy</Heading>
            <Text style={{ color: "#525252", lineHeight: 1.7 }}>
              {name}, your first chapter is live. Start with{" "}
              <strong>{chapterTitle}</strong>, then come back to the dashboard
              to verify that your progress persisted.
            </Text>
            <Button
              href={chapterUrl}
              style={{
                backgroundColor: "#f76f53",
                color: "#fff",
                padding: "14px 20px",
                borderRadius: "10px",
                textDecoration: "none",
              }}
            >
              Open the chapter
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderWelcomeEmail(props: WelcomeEmailProps) {
  return render(<WelcomeEmail {...props} />);
}
