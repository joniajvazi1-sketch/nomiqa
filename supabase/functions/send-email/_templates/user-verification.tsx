import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.25";
import * as React from "npm:react@18.3.1";

interface UserVerificationEmailProps {
  code: string;
  language?: string;
}

const translations: Record<string, any> = {
  en: {
    preview: "Verify your Nomiqa account",
    title: "Verify Your Email",
    message: "Enter this code to complete your registration:",
    expires: "This code expires in 15 minutes",
    security: "If you didn't request this, please ignore this email.",
    footer: "Private. Borderless. Human.",
  },
  de: {
    preview: "Verifizieren Sie Ihr Nomiqa-Konto",
    title: "Verifizieren Sie Ihre E-Mail",
    message: "Geben Sie diesen Code ein, um Ihre Registrierung abzuschließen:",
    expires: "Dieser Code läuft in 15 Minuten ab",
    security: "Wenn Sie dies nicht angefordert haben, ignorieren Sie bitte diese E-Mail.",
    footer: "Privat. Grenzenlos. Menschlich.",
  },
  // Add more languages as needed
};

export const UserVerificationEmail = ({
  code,
  language = "en",
}: UserVerificationEmailProps) => {
  const t = translations[language] || translations.en;

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://gzhmbiopiciugriatsdb.supabase.co/storage/v1/object/public/public-assets/nomiqa-logo.jpg"
              width="120"
              height="120"
              alt="Nomiqa"
              style={logo}
            />
          </Section>
          <Heading style={h1}>{t.title}</Heading>
          <Text style={text}>{t.message}</Text>
          <Section style={codeSection}>
            {code.split('').map((digit, index) => (
              <span key={index} style={codeDigit}>{digit}</span>
            ))}
          </Section>
          <Text style={expireText}>{t.expires}</Text>
          <Text style={securityText}>{t.security}</Text>
          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default UserVerificationEmail;

const main = {
  backgroundColor: "#0a0118",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  borderRadius: "50%",
  border: "3px solid #9b87f5",
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "30px 0",
  background: "linear-gradient(135deg, #00e5ff 0%, #9b87f5 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const text = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "center" as const,
  marginBottom: "32px",
};

const codeSection = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  margin: "40px 0",
  padding: "30px 20px",
  background: "rgba(155, 135, 245, 0.1)",
  borderRadius: "16px",
  border: "1px solid rgba(155, 135, 245, 0.3)",
  backdropFilter: "blur(20px)",
};

const codeDigit = {
  display: "inline-block",
  width: "50px",
  height: "60px",
  lineHeight: "60px",
  fontSize: "28px",
  fontWeight: "700",
  color: "#00e5ff",
  background: "rgba(0, 229, 255, 0.1)",
  border: "2px solid #00e5ff",
  borderRadius: "12px",
  textAlign: "center" as const,
  boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
};

const expireText = {
  color: "#fbbf24",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "24px 0",
  fontWeight: "500",
};

const securityText = {
  color: "#9ca3af",
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "32px 0 16px",
};

const footer = {
  color: "#9b87f5",
  fontSize: "14px",
  textAlign: "center" as const,
  marginTop: "40px",
  fontWeight: "500",
};
