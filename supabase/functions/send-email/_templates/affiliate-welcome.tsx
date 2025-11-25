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

interface AffiliateWelcomeEmailProps {
  username: string;
  affiliateCode: string;
  language?: string;
}

const translations: Record<string, any> = {
  en: {
    preview: "Welcome to Nomiqa Affiliates",
    title: "Welcome to the Nomiqa Affiliate Program! 🚀",
    welcome: "Welcome",
    active: "Your affiliate account is now active!",
    code: "Your Affiliate Code:",
    earn: "Start Earning REAL Crypto",
    earnDesc: "Unlike other platforms that pay in vouchers, we pay you in real USDC & SOL cryptocurrency:",
    tier1: "Level 1: 9% direct referral commission",
    tier2: "Level 2: 6% passive income (after 10 conversions)",
    tier3: "Level 3: 3% passive income (after 30 conversions)",
    dashboard: "Visit your dashboard to start sharing your link",
    footer: "Private. Borderless. Human.",
  },
  de: {
    preview: "Willkommen bei Nomiqa-Partnern",
    title: "Willkommen beim Nomiqa-Partnerprogramm! 🚀",
    welcome: "Willkommen",
    active: "Ihr Partner-Konto ist jetzt aktiv!",
    code: "Ihr Partner-Code:",
    earn: "Beginnen Sie, ECHTES Krypto zu verdienen",
    earnDesc: "Im Gegensatz zu anderen Plattformen, die in Gutscheinen zahlen, zahlen wir Ihnen in echten USDC & SOL Kryptowährungen:",
    tier1: "Stufe 1: 9% direkte Empfehlungsprovision",
    tier2: "Stufe 2: 6% passives Einkommen (nach 10 Conversions)",
    tier3: "Stufe 3: 3% passives Einkommen (nach 30 Conversions)",
    dashboard: "Besuchen Sie Ihr Dashboard, um Ihren Link zu teilen",
    footer: "Privat. Grenzenlos. Menschlich.",
  },
};

export const AffiliateWelcomeEmail = ({
  username,
  affiliateCode,
  language = "en",
}: AffiliateWelcomeEmailProps) => {
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
          <Text style={welcomeText}>{t.welcome}, {username}! 🎉</Text>
          <Text style={text}>{t.active}</Text>
          
          <Section style={codeSection}>
            <Text style={codeLabel}>{t.code}</Text>
            <Text style={code}>{affiliateCode}</Text>
          </Section>

          <Section style={earnSection}>
            <Heading style={earnTitle}>{t.earn}</Heading>
            <Text style={earnDesc}>{t.earnDesc}</Text>
            <div style={tierContainer}>
              <Text style={tierText}>✓ {t.tier1}</Text>
              <Text style={tierText}>✓ {t.tier2}</Text>
              <Text style={tierText}>✓ {t.tier3}</Text>
            </div>
          </Section>

          <Section style={ctaSection}>
            <Text style={ctaText}>{t.dashboard}</Text>
          </Section>

          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AffiliateWelcomeEmail;

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

const welcomeText = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "600",
  textAlign: "center" as const,
  marginBottom: "16px",
};

const text = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "center" as const,
  marginBottom: "32px",
};

const codeSection = {
  background: "rgba(155, 135, 245, 0.1)",
  border: "2px solid #9b87f5",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#9ca3af",
  fontSize: "14px",
  marginBottom: "8px",
};

const code = {
  color: "#00e5ff",
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "2px",
  textShadow: "0 0 20px rgba(0, 229, 255, 0.5)",
};

const earnSection = {
  background: "rgba(0, 229, 255, 0.05)",
  border: "1px solid rgba(0, 229, 255, 0.2)",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
};

const earnTitle = {
  color: "#00e5ff",
  fontSize: "20px",
  fontWeight: "600",
  marginBottom: "12px",
  textAlign: "center" as const,
};

const earnDesc = {
  color: "#e0e0e0",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const,
  marginBottom: "20px",
};

const tierContainer = {
  marginTop: "16px",
};

const tierText = {
  color: "#00e5ff",
  fontSize: "14px",
  marginBottom: "8px",
  textAlign: "center" as const,
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const ctaText = {
  color: "#9ca3af",
  fontSize: "14px",
};

const footer = {
  color: "#9b87f5",
  fontSize: "14px",
  textAlign: "center" as const,
  marginTop: "40px",
  fontWeight: "500",
};
