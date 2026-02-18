import { useTranslation } from "@/contexts/TranslationContext";

export const TermsWithdrawal = () => {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-violet">
        {t("termsWithdrawalPolicyTitle")}
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">{t("termsWithdrawalPolicyContent")}</p>
      <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsWithdrawalPolicyCustomer")}</p>
      <p className="text-muted-foreground leading-relaxed italic">{t("termsWithdrawalPolicyConfirmation")}</p>
    </section>
  );
};
