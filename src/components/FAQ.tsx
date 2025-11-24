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

export const FAQ = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  
  const faqs = [
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
  ];

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
              {t("faqTitle")}
            </h2>
            <p className="text-base md:text-xl text-foreground/80">
              {t("faqSubtitle")}
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.slice(0, 5).map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 rounded-xl px-4 md:px-6 transition-all hover:bg-white/[0.04]"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-foreground hover:text-neon-cyan transition-colors py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 leading-relaxed text-sm md:text-base pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="flex justify-center mt-8 md:mt-12">
            <Button
              onClick={() => navigate(localizedPath("/help", language))}
              size="lg"
              className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white border-0 shadow-glow-cyan font-light px-8 rounded-xl transition-all duration-300"
            >
              {t("contactHelpCenter")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
