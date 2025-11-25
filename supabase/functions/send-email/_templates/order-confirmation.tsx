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

interface OrderConfirmationEmailProps {
  orderId: string;
  country: string;
  dataAmount: string;
  validity: number;
  price: number;
  language?: string;
}

const translations: Record<string, any> = {
  en: {
    preview: "Your eSIM order is confirmed",
    title: "Order Confirmed! 🌍",
    thank: "Thank you for your order!",
    orderNum: "Order Number:",
    details: "Order Details",
    country: "Country:",
    data: "Data:",
    validity: "Validity:",
    days: "days",
    price: "Price:",
    status: "Your eSIM is being prepared",
    activation: "You'll receive your activation details shortly",
    support: "Need help? Contact us at support@nomiqa-esim.com",
    footer: "Private. Borderless. Human.",
  },
  de: {
    preview: "Ihre eSIM-Bestellung ist bestätigt",
    title: "Bestellung bestätigt! 🌍",
    thank: "Vielen Dank für Ihre Bestellung!",
    orderNum: "Bestellnummer:",
    details: "Bestelldetails",
    country: "Land:",
    data: "Daten:",
    validity: "Gültigkeit:",
    days: "Tage",
    price: "Preis:",
    status: "Ihre eSIM wird vorbereitet",
    activation: "Sie erhalten Ihre Aktivierungsdetails in Kürze",
    support: "Brauchen Sie Hilfe? Kontaktieren Sie uns unter support@nomiqa-esim.com",
    footer: "Privat. Grenzenlos. Menschlich.",
  },
};

export const OrderConfirmationEmail = ({
  orderId,
  country,
  dataAmount,
  validity,
  price,
  language = "en",
}: OrderConfirmationEmailProps) => {
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
          <Text style={thankText}>{t.thank}</Text>
          <Text style={orderIdText}>{t.orderNum} <strong>{orderId}</strong></Text>
          
          <Section style={detailsSection}>
            <Heading style={detailsTitle}>{t.details}</Heading>
            <div style={detailRow}>
              <span style={detailLabel}>{t.country}</span>
              <span style={detailValue}>{country}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>{t.data}</span>
              <span style={detailValue}>{dataAmount}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>{t.validity}</span>
              <span style={detailValue}>{validity} {t.days}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>{t.price}</span>
              <span style={detailValue}>${price}</span>
            </div>
          </Section>

          <Section style={statusSection}>
            <Text style={statusText}>✓ {t.status}</Text>
            <Text style={activationText}>{t.activation}</Text>
          </Section>

          <Text style={supportText}>{t.support}</Text>
          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

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
  fontSize: "36px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "30px 0",
  background: "linear-gradient(135deg, #00e5ff 0%, #9b87f5 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const thankText = {
  color: "#e0e0e0",
  fontSize: "18px",
  lineHeight: "28px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const orderIdText = {
  color: "#9ca3af",
  fontSize: "14px",
  textAlign: "center" as const,
  marginBottom: "32px",
};

const detailsSection = {
  background: "rgba(155, 135, 245, 0.05)",
  border: "1px solid rgba(155, 135, 245, 0.2)",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
};

const detailsTitle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "600",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
  paddingBottom: "12px",
  borderBottom: "1px solid rgba(155, 135, 245, 0.1)",
};

const detailLabel = {
  color: "#9ca3af",
  fontSize: "14px",
};

const detailValue = {
  color: "#00e5ff",
  fontSize: "14px",
  fontWeight: "600",
};

const statusSection = {
  background: "rgba(34, 197, 94, 0.1)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const statusText = {
  color: "#22c55e",
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "8px",
};

const activationText = {
  color: "#e0e0e0",
  fontSize: "14px",
};

const supportText = {
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
