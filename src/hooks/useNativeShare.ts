import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { usePlatform } from './usePlatform';
import { useToast } from './use-toast';

/**
 * Native sharing and clipboard hook
 * Falls back to web APIs when not on native platform
 */
export const useNativeShare = () => {
  const { isNative } = usePlatform();
  const { toast } = useToast();

  const share = async (options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }) => {
    try {
      if (isNative) {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle || 'Share'
        });
      } else if (navigator.share) {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url
        });
      } else {
        // Fallback: copy to clipboard
        await copyToClipboard(options.url || options.text || '');
        toast({
          title: 'Link copied!',
          description: 'Share link copied to clipboard'
        });
      }
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (isNative) {
        await Clipboard.write({ string: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      return true;
    } catch (error) {
      console.warn('Clipboard write failed:', error);
      return false;
    }
  };

  const readFromClipboard = async (): Promise<string | null> => {
    try {
      if (isNative) {
        const { value } = await Clipboard.read();
        return value;
      } else {
        return await navigator.clipboard.readText();
      }
    } catch (error) {
      console.warn('Clipboard read failed:', error);
      return null;
    }
  };

  return {
    share,
    copyToClipboard,
    readFromClipboard
  };
};
