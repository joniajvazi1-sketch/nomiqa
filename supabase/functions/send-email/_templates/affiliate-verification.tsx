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

interface AffiliateVerificationEmailProps {
  code: string;
  language?: string;
}

const translations: Record<string, any> = {
  en: {
    preview: "Verify your Nomiqa affiliate account",
    title: "Verify Your Affiliate Account",
    message: "Enter this code to activate your affiliate account:",
    benefits: "Start earning REAL crypto (USDC & SOL) with our 3-tier commission system:",
    tier1: "9% direct referral commission",
    tier2: "6% tier 2 passive income",
    tier3: "3% tier 3 passive income",
    expires: "This code expires in 15 minutes",
    security: "If you didn't request this, please ignore this email.",
    footer: "Private. Borderless. Human.",
  },
  de: {
    preview: "Verifizieren Sie Ihr Nomiqa-Partner-Konto",
    title: "Verifizieren Sie Ihr Partner-Konto",
    message: "Geben Sie diesen Code ein, um Ihr Partner-Konto zu aktivieren:",
    benefits: "Beginnen Sie, ECHTES Krypto (USDC & SOL) mit unserem 3-stufigen Provisionssystem zu verdienen:",
    tier1: "9% direkte Empfehlungsprovision",
    tier2: "6% Stufe 2 passives Einkommen",
    tier3: "3% Stufe 3 passives Einkommen",
    expires: "Dieser Code läuft in 15 Minuten ab",
    security: "Wenn Sie dies nicht angefordert haben, ignorieren Sie bitte diese E-Mail.",
    footer: "Privat. Grenzenlos. Menschlich.",
  },
};

export const AffiliateVerificationEmail = ({
  code,
  language = "en",
}: AffiliateVerificationEmailProps) => {
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
          <Section style={benefitsSection}>
            <Text style={benefitsTitle}>{t.benefits}</Text>
            <Text style={tierText}>✓ {t.tier1}</Text>
            <Text style={tierText}>✓ {t.tier2}</Text>
            <Text style={tierText}>✓ {t.tier3}</Text>
          </Section>
          <Text style={expireText}>{t.expires}</Text>
          <Text style={securityText}>{t.security}</Text>
          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AffiliateVerificationEmail;

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

const benefitsSection = {
  background: "rgba(0, 229, 255, 0.05)",
  border: "1px solid rgba(0, 229, 255, 0.2)",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
};

const benefitsTitle = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "16px",
  textAlign: "center" as const,
};

const tierText = {
  color: "#00e5ff",
  fontSize: "14px",
  marginBottom: "8px",
  textAlign: "center" as const,
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
