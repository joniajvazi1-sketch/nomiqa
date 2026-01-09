import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation, Language } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface LanguageOption {
  code: Language;
  flag: string;
  nativeName: string;
  englishName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'EN', flag: '🇺🇸', nativeName: 'English', englishName: 'English' },
  { code: 'DE', flag: '🇩🇪', nativeName: 'Deutsch', englishName: 'German' },
  { code: 'FR', flag: '🇫🇷', nativeName: 'Français', englishName: 'French' },
  { code: 'ES', flag: '🇪🇸', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'IT', flag: '🇮🇹', nativeName: 'Italiano', englishName: 'Italian' },
  { code: 'PT', flag: '🇵🇹', nativeName: 'Português', englishName: 'Portuguese' },
  { code: 'JA', flag: '🇯🇵', nativeName: '日本語', englishName: 'Japanese' },
  { code: 'ZH', flag: '🇨🇳', nativeName: '中文', englishName: 'Chinese' },
  { code: 'RU', flag: '🇷🇺', nativeName: 'Русский', englishName: 'Russian' },
  { code: 'AR', flag: '🇸🇦', nativeName: 'العربية', englishName: 'Arabic' },
];

export const LanguageSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { lightTap, mediumTap, success } = useHaptics();
  const { language, setLanguage, t } = useTranslation();

  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const handleSelectLanguage = (lang: Language) => {
    mediumTap();
    setLanguage(lang);
    success();
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button 
          onClick={() => lightTap()}
          className="w-10 h-10 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] active:scale-95 transition-all"
        >
          <Globe className="w-4.5 h-4.5 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/[0.08]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-foreground">
            {t('app.settings.selectLanguage')}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-1 max-h-[60vh] overflow-y-auto">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]",
                  isSelected 
                    ? "bg-primary/15 border border-primary/30" 
                    : "bg-white/[0.03] border border-transparent hover:bg-white/[0.06]"
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className={cn(
                    "font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {lang.nativeName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lang.englishName}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
