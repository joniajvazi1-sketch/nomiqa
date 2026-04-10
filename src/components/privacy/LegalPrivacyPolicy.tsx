import { useTranslation } from "@/contexts/TranslationContext";
import { FileText, MapPin, Database, ShieldCheck, Users, Clock, Scale, Lock, Mail } from "lucide-react";

export const LegalPrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-12 md:py-16 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {t("privacyLegalTitle")}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-light text-white mb-2">
            {t("privacyLegalTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("privacyLegalEffective")}</p>
        </div>

        <div className="space-y-8">
          {/* 1. Data Controller */}
          <PolicySection icon={ShieldCheck} title={t("privacyLegalControllerTitle")}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacyLegalControllerContent")}
            </p>
          </PolicySection>

          {/* 2. Location Data */}
          <PolicySection icon={MapPin} title={t("privacyLegalLocationTitle")}>
            <p className="text-sm text-muted-foreground font-semibold mb-2">
              {t("privacyLegalLocationWhat")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2 mb-4">
              <li>{t("privacyLegalLocationItem1")}</li>
              <li>{t("privacyLegalLocationItem2")}</li>
              <li>{t("privacyLegalLocationItem3")}</li>
            </ul>

            <p className="text-sm text-muted-foreground font-semibold mb-2">
              {t("privacyLegalLocationWhen")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2 mb-4">
              <li>{t("privacyLegalLocationWhen1")}</li>
              <li>{t("privacyLegalLocationWhen2")}</li>
            </ul>

            <p className="text-sm text-muted-foreground font-semibold mb-2">
              {t("privacyLegalLocationWhy")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2 mb-4">
              <li>{t("privacyLegalLocationWhy1")}</li>
              <li>{t("privacyLegalLocationWhy2")}</li>
            </ul>

            <p className="text-sm text-muted-foreground font-semibold mb-2">
              {t("privacyLegalLocationShare")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2 mb-4">
              <li>{t("privacyLegalLocationShare1")}</li>
              <li>{t("privacyLegalLocationShare2")}</li>
            </ul>

            <p className="text-sm text-muted-foreground font-semibold mb-2">
              {t("privacyLegalLocationRetention")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>{t("privacyLegalLocationRetention1")}</li>
              <li>{t("privacyLegalLocationRetention2")}</li>
            </ul>
          </PolicySection>

          {/* 3. Other Data */}
          <PolicySection icon={Database} title={t("privacyLegalOtherDataTitle")}>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>{t("privacyLegalOtherData1")}</li>
              <li>{t("privacyLegalOtherData2")}</li>
              <li>{t("privacyLegalOtherData3")}</li>
              <li>{t("privacyLegalOtherData4")}</li>
            </ul>
          </PolicySection>

          {/* 4. Data We Do NOT Collect */}
          <PolicySection icon={ShieldCheck} title={t("privacyLegalNotCollectedTitle")}>
            <p className="text-sm text-muted-foreground mb-2">{t("termsPrivacyNotCollectedIntro")}</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>{t("termsPrivacyNotCollected1")}</li>
              <li>{t("termsPrivacyNotCollected2")}</li>
              <li>{t("termsPrivacyNotCollected3")}</li>
              <li>{t("termsPrivacyNotCollected4")}</li>
              <li>{t("termsPrivacyNotCollected5")}</li>
              <li>{t("termsPrivacyNotCollected6")}</li>
              <li>{t("termsPrivacyNotCollected7")}</li>
            </ul>
          </PolicySection>

          {/* 5. Legal Basis */}
          <PolicySection icon={Scale} title={t("privacyLegalPurposeTitle")}>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>{t("privacyLegalPurpose1")}</li>
              <li>{t("privacyLegalPurpose2")}</li>
              <li>{t("privacyLegalPurpose3")}</li>
            </ul>
          </PolicySection>

          {/* 6. Third-Party Sharing */}
          <PolicySection icon={Users} title={t("privacyLegalThirdPartyTitle")}>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>{t("privacyLegalThirdParty1")}</li>
              <li>{t("privacyLegalThirdParty2")}</li>
              <li>{t("privacyLegalThirdParty3")}</li>
            </ul>
          </PolicySection>

          {/* 7. Data Retention */}
          <PolicySection icon={Clock} title={t("privacyLegalRetentionTitle")}>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>{t("privacyLegalRetention1")}</li>
              <li>{t("privacyLegalRetention2")}</li>
              <li>{t("privacyLegalRetention3")}</li>
            </ul>
          </PolicySection>

          {/* 8. Your Rights */}
          <PolicySection icon={Scale} title={t("privacyLegalRightsTitle")}>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2 mb-3">
              <li>{t("privacyLegalRights1")}</li>
              <li>{t("privacyLegalRights2")}</li>
              <li>{t("privacyLegalRights3")}</li>
              <li>{t("privacyLegalRights4")}</li>
              <li>{t("privacyLegalRights5")}</li>
            </ul>
            <p className="text-sm text-muted-foreground">{t("privacyLegalRightsContact")}</p>
          </PolicySection>

          {/* 9. Security */}
          <PolicySection icon={Lock} title={t("privacyLegalSecurityTitle")}>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>{t("privacyLegalSecurity1")}</li>
              <li>{t("privacyLegalSecurity2")}</li>
              <li>{t("privacyLegalSecurity3")}</li>
            </ul>
          </PolicySection>

          {/* 10. Contact */}
          <PolicySection icon={Mail} title={t("privacyLegalContactTitle")}>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {t("privacyLegalContactContent")}
            </p>
          </PolicySection>
        </div>
      </div>
    </section>
  );
};

const PolicySection = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
    </div>
    {children}
  </div>
);
