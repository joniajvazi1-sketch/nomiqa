import React from 'react';
import { HelpCircle, Battery, Shield, Gift, ExternalLink, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { APP_COPY } from '@/utils/appCopy';

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

export const HelpCenter: React.FC = () => {
  const handleContactSupport = () => {
    window.open('mailto:support@nomiqa.com', '_blank');
  };

  const handleViewDocs = () => {
    window.open('https://nomiqa.com/help', '_blank');
  };

  return (
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
};

export default HelpCenter;
