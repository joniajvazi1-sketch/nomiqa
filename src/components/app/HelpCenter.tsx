import React from 'react';
import { HelpCircle, Battery, Shield, Gift, ExternalLink, MessageCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { APP_COPY } from '@/utils/appCopy';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
  icon: typeof HelpCircle;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: APP_COPY.help.batteryQuestion,
    answer: APP_COPY.help.batteryAnswer,
    icon: Battery,
  },
  {
    question: APP_COPY.help.dataQuestion,
    answer: APP_COPY.help.dataAnswer,
    icon: Shield,
  },
  {
    question: APP_COPY.help.redeemQuestion,
    answer: APP_COPY.help.redeemAnswer,
    icon: Gift,
  },
  {
    question: APP_COPY.help.privacyQuestion,
    answer: APP_COPY.help.privacyAnswer,
    icon: Shield,
  },
];

interface HelpCenterProps {
  onClose?: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (onClose) {
      scrollRef.current?.scrollTo(0, 0);
    }
  }, [onClose]);

  const handleContactSupport = () => {
    window.open('mailto:support@nomiqa.com', '_blank');
  };

  const handleViewDocs = () => {
    window.open('https://nomiqa-depin.com/help', '_blank');
  };

  const content = (
    <div className="space-y-4">
      {/* FAQ Section */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Frequently Asked</h3>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <AccordionItem key={index} value={`item-${index}`} className="border-border">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {item.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleContactSupport}
          className="h-auto py-3 flex-col gap-1"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs">Contact Support</span>
        </Button>
        <Button
          variant="outline"
          onClick={handleViewDocs}
          className="h-auto py-3 flex-col gap-1"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="text-xs">Full Help Center</span>
        </Button>
      </div>

      {/* Privacy Note */}
      <p className="text-xs text-center text-muted-foreground px-4">
        {APP_COPY.privacy.dataAnonymized}
      </p>
    </div>
  );

  // If no onClose provided, render inline
  if (!onClose) {
    return content;
  }

  // Render as modal

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
      >
        <div ref={scrollRef} className="h-full overflow-y-auto pb-safe">
          <div className="px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-foreground">Help & FAQ</h1>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {content}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HelpCenter;
