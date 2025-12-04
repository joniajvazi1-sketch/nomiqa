import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { localizedPath } from "@/utils/localizedLinks";
import { memo, useMemo } from "react";

interface FAQProps {
  showAll?: boolean;
}

export const FAQ = memo(({ showAll = false }: FAQProps) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  
  const faqs = useMemo(() => [
    {
      question: t("faq1Q"),
      answer: t("faq1A")
    },
    {
      question: t("faq2Q"),
      answer: t("faq2A")
    },
    {
      question: t("faq3Q"),
      answer: t("faq3A")
    },
    {
      question: t("faq4Q"),
      answer: t("faq4A")
    },
    {
      question: t("faq5Q"),
      answer: t("faq5A")
    },
    {
      question: t("faq6Q"),
      answer: t("faq6A")
    },
    {
      question: t("faq7Q"),
      answer: t("faq7A")
    },
    {
      question: t("faq8Q"),
      answer: t("faq8A")
    },
    {
      question: t("faq9Q"),
      answer: t("faq9A")
    },
    {
      question: t("faq10Q"),
      answer: t("faq10A")
    }
  ], [t]);

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Premium background decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-violet/5 rounded-full blur-3xl"></div>
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-3 md:mb-4">
              <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
                {t("faqTitle")}
              </span>
            </h2>
            <p className="text-base md:text-xl text-white/70 font-light">
              {t("faqSubtitle")}
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {(showAll ? faqs : faqs.slice(0, 5)).map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-neon-cyan/30 rounded-xl px-4 md:px-6 transition-colors duration-100 hover:bg-white/[0.04]"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-foreground hover:text-neon-cyan transition-colors duration-100 py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 leading-relaxed text-sm md:text-base pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {!showAll && (
            <div className="flex justify-center mt-8 md:mt-12">
              <Button
                onClick={() => navigate(localizedPath("/help", language))}
                size="lg"
                className="group bg-white/[0.03] backdrop-blur-xl border-2 border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 px-10 py-7 text-base md:text-lg rounded-2xl font-light transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-cyan/20"
              >
                {t("contactHelpCenter")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
