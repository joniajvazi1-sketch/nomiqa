import React from 'react';
import { Globe } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';

/**
 * Language Selector - Coming Soon
 * Displays a toast when pressed indicating multi-language support is coming
 */
export const LanguageSelector: React.FC = () => {
  const { lightTap } = useHaptics();

  const handlePress = () => {
    lightTap();
    toast('Coming Soon', {
      description: 'Multi-language support will be available in a future update.',
      duration: 2500,
    });
  };

  return (
    <button 
      onClick={handlePress}
      className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
    >
      <Globe className="w-4.5 h-4.5 text-muted-foreground" />
    </button>
  );
};
