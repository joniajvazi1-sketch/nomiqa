import { useTranslation } from "@/contexts/TranslationContext";

export const TermsLegalNotice = () => {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-cyan">
        {t("termsLegalNoticeTitle")}
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p className="font-semibold text-white">{t("termsLegalNoticeCompany")}</p>
        <p>{t("termsLegalNoticeAddress")}</p>
        <p>{t("termsLegalNoticeReg")}</p>
        <p>{t("termsLegalNoticeDirector")}</p>
        <p>{t("termsLegalNoticeEmail")}</p>
        <p>{t("termsLegalNoticeWebsite")}</p>
        <div className="pt-4">
          <p className="font-semibold text-white">{t("termsVATTitle")}</p>
          <p>{t("termsVATContent")}</p>
        </div>
        <div className="pt-4">
          <p className="font-semibold text-white">{t("termsResponsibleTitle")}</p>
          <p>{t("termsResponsibleContent")}</p>
        </div>
        <div className="pt-4">
          <p className="font-semibold text-white">{t("termsODRTitle")}</p>
          <p>{t("termsODRLink")}</p>
          <p>{t("termsODRContent")}</p>
        </div>
      </div>
    </section>
  );
};
