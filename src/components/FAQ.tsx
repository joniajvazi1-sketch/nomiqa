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
      question: "What are eSIMs?",
      answer: "An eSIM (embedded SIM) is a digital SIM card that allows you to activate a cellular plan without using a physical SIM card. It's built directly into your device and can be programmed remotely, making it perfect for travelers who want to switch between carriers or plans instantly."
    },
    {
      question: "How do eSIMs work with Nomiqa?",
      answer: "Simply purchase an eSIM plan using cryptocurrency, receive a QR code via email, and scan it with your phone. Your eSIM will be activated instantly without any paperwork or physical SIM card needed. You can keep your existing number and use the eSIM for data while traveling."
    },
    {
      question: "Do I need to remove my physical SIM card?",
      answer: "No! Most modern smartphones support dual SIM functionality, allowing you to use both your physical SIM and eSIM simultaneously. You can keep your home number active while using the eSIM for data in other countries."
    },
    {
      question: "What cryptocurrencies do you accept?",
      answer: "We accept payments in Solana (SOL) and our native Nomiqa (NMQ) token through NowPayments. This ensures fast, secure, and private transactions without the need for traditional payment methods."
    },
    {
      question: "Is KYC required to purchase an eSIM?",
      answer: "No! One of Nomiqa's core principles is privacy. We don't require any KYC (Know Your Customer) verification, personal identification, or lengthy registration processes. Just pay with crypto and activate your eSIM instantly."
    },
    {
      question: "How long does eSIM activation take?",
      answer: "Activation is instant! Once your cryptocurrency payment is confirmed (usually within minutes), you'll receive your eSIM QR code via email. Simply scan the code with your device and you're connected. The entire process typically takes less than 5 minutes."
    },
    {
      question: "Which countries are supported?",
      answer: "Nomiqa provides coverage in over 200 countries and regions worldwide. We offer both single-country plans and regional packages for areas like Europe, Asia, North America, and more. Check our shop page to see specific coverage for your destination."
    },
    {
      question: "Can I top up or extend my eSIM plan?",
      answer: "Yes! You can purchase additional data packages or extend your plan duration at any time through our platform. Simply visit the shop, select your current destination, and add more data to your existing eSIM."
    },
    {
      question: "What devices are compatible with eSIM?",
      answer: "Most modern smartphones support eSIM technology, including iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many other devices. Check your device settings to confirm eSIM compatibility before purchasing."
    },
    {
      question: "How do I earn Nomiqa (NMQ) tokens?",
      answer: "You earn NMQ tokens with every eSIM purchase. Additionally, you can participate in our affiliate program to earn more tokens by referring friends. In the future, you'll also be able to stake your NMQ tokens to earn passive rewards."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-nomiqa-peach/10 via-background to-nomiqa-cream/20">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t("faqTitle")}</h2>
            <p className="text-xl text-muted-foreground">
              {t("faqSubtitle")}
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white border border-border rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-nomiqa-orange">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
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
