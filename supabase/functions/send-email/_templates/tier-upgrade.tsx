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

interface TierUpgradeEmailProps {
  username: string;
  tier: string;
  cashbackRate: number;
  language?: string;
}

const translations: Record<string, any> = {
  en: {
    preview: "You've unlocked a new tier",
    congrats: "Congratulations",
    unlocked: "You've unlocked",
    newRate: "New Cashback Rate:",
    message: "You now earn {rate}% cashback on all eSIM purchases!",
    thank: "Thank you for being a valued Nomiqa member",
    continue: "Continue exploring with Nomiqa and unlock even more rewards",
    footer: "Private. Borderless. Human.",
  },
  de: {
    preview: "Sie haben eine neue Stufe freigeschaltet",
    congrats: "Herzlichen Glückwunsch",
    unlocked: "Sie haben freigeschaltet",
    newRate: "Neue Cashback-Rate:",
    message: "Sie erhalten jetzt {rate}% Cashback auf alle eSIM-Käufe!",
    thank: "Vielen Dank, dass Sie ein geschätztes Nomiqa-Mitglied sind",
    continue: "Erkunden Sie weiter mit Nomiqa und schalten Sie noch mehr Belohnungen frei",
    footer: "Privat. Grenzenlos. Menschlich.",
  },
};

const tierEmojis: Record<string, string> = {
  beginner: "🥉",
  traveler: "🥈",
  adventurer: "🥇",
  explorer: "💎",
};

export const TierUpgradeEmail = ({
  username,
  tier,
  cashbackRate,
  language = "en",
}: TierUpgradeEmailProps) => {
  const t = translations[language] || translations.en;
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

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
          
          <Section style={celebrationSection}>
            <Text style={emoji}>🎉 {tierEmojis[tier.toLowerCase()] || "✨"} 🎉</Text>
            <Heading style={h1}>{t.congrats}, {username}!</Heading>
          </Section>

          <Section style={tierSection}>
            <Text style={unlockedText}>{t.unlocked}</Text>
            <Text style={tierName as any}>{tierName}</Text>
          </Section>

          <Section style={rateSection}>
            <Text style={rateLabel}>{t.newRate}</Text>
            <Text style={rateValue}>{cashbackRate}%</Text>
          </Section>

          <Text style={messageText}>
            {t.message.replace('{rate}', cashbackRate.toString())}
          </Text>

          <Section style={thankSection}>
            <Text style={thankText}>{t.thank}</Text>
            <Text style={continueText}>{t.continue}</Text>
          </Section>

          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TierUpgradeEmail;

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

const celebrationSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const emoji = {
  fontSize: "48px",
  marginBottom: "16px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "16px 0",
  background: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const tierSection = {
  background: "rgba(155, 135, 245, 0.1)",
  border: "2px solid #9b87f5",
  borderRadius: "16px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
  boxShadow: "0 0 40px rgba(155, 135, 245, 0.3)",
};

const unlockedText = {
  color: "#9ca3af",
  fontSize: "16px",
  marginBottom: "12px",
};

const tierName = {
  color: "#00e5ff",
  fontSize: "36px",
  fontWeight: "700",
  textShadow: "0 0 30px rgba(0, 229, 255, 0.6)",
};

const rateSection = {
  background: "rgba(0, 229, 255, 0.1)",
  border: "1px solid rgba(0, 229, 255, 0.3)",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const rateLabel = {
  color: "#9ca3af",
  fontSize: "14px",
  marginBottom: "8px",
};

const rateValue = {
  color: "#00e5ff",
  fontSize: "48px",
  fontWeight: "700",
};

const messageText = {
  color: "#e0e0e0",
  fontSize: "18px",
  lineHeight: "28px",
  textAlign: "center" as const,
  marginBottom: "32px",
};

const thankSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const thankText = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "12px",
};

const continueText = {
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
