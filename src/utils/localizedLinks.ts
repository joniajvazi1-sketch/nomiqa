import type { Language } from "@/contexts/TranslationContext";

const LOCALE_SLUGS: Record<Language, string> = {
  EN: 'english',
  ES: 'espanol',
  FR: 'francais',
  DE: 'deutsch',
  RU: 'russian',
  ZH: 'chinese',
  JA: 'japanese',
  PT: 'portugues',
  AR: 'arabic',
  IT: 'italiano',
};

// Get current locale slug from path
export function getCurrentLocaleSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const slug = window.location.pathname.split('/')[1]?.toLowerCase();
  return Object.values(LOCALE_SLUGS).includes(slug) ? slug : null;
}

// Get current language from path
export function getCurrentLanguage(): Language | null {
  const slug = getCurrentLocaleSlug();
  if (!slug) return null;
  
  for (const [lang, localeSlug] of Object.entries(LOCALE_SLUGS)) {
    if (localeSlug === slug) return lang as Language;
  }
  return null;
}

// Create localized path
export function localizedPath(path: string, language?: Language): string {
  // Clean the path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If no language provided, try to get current language
  const lang = language || getCurrentLanguage();
  
  // If no language detected, return original path
  if (!lang) return cleanPath;
  
  const localeSlug = LOCALE_SLUGS[lang];
  
  // If it's the root path
  if (cleanPath === '/') {
    return `/${localeSlug}`;
  }
  
  // Prefix with locale
  return `/${localeSlug}${cleanPath}`;
}