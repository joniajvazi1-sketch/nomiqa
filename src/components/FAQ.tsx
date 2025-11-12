import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/contexts/TranslationContext";

export const FAQ = () => {
  const { t } = useTranslation();
  
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
    <section className="py-12 md:py-20 bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-neon-cyan rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-neon bg-clip-text text-transparent">
              {t("faqTitle")}
            </h2>
            <p className="text-base md:text-xl text-foreground/70">
              {t("faqSubtitle")}
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card/50 backdrop-blur-xl border border-neon-cyan/20 rounded-xl px-4 md:px-6 shadow-lg hover:shadow-glow-cyan transition-all"
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
        </div>
      </div>
    </section>
  );
};
