import { useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useToast } from './use-toast';

// Type-only imports
type ShareModule = typeof import('@capacitor/share');
type ClipboardModule = typeof import('@capacitor/clipboard');

/**
 * Native sharing and clipboard hook
 * Falls back to web APIs when not on native platform
 * Uses dynamic imports to avoid bundling Capacitor on web
 */
export const useNativeShare = () => {
  const isNative = Capacitor.isNativePlatform();
  const { toast } = useToast();
  const shareRef = useRef<ShareModule | null>(null);
  const clipboardRef = useRef<ClipboardModule | null>(null);

  // Preload modules on native
  useEffect(() => {
    if (isNative) {
      import('@capacitor/share').then(m => { shareRef.current = m; }).catch(() => {});
      import('@capacitor/clipboard').then(m => { clipboardRef.current = m; }).catch(() => {});
    }
  }, [isNative]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (isNative) {
        if (!clipboardRef.current) {
          clipboardRef.current = await import('@capacitor/clipboard');
        }
        await clipboardRef.current.Clipboard.write({ string: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      return true;
    } catch (error) {
      console.warn('Clipboard write failed:', error);
      return false;
    }
  }, [isNative]);

  const share = useCallback(async (options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }) => {
    try {
      if (isNative) {
        if (!shareRef.current) {
          shareRef.current = await import('@capacitor/share');
        }
        await shareRef.current.Share.share({
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
  }, [isNative, copyToClipboard, toast]);

  const readFromClipboard = useCallback(async (): Promise<string | null> => {
    try {
      if (isNative) {
        if (!clipboardRef.current) {
          clipboardRef.current = await import('@capacitor/clipboard');
        }
        const { value } = await clipboardRef.current.Clipboard.read();
        return value;
      } else {
        return await navigator.clipboard.readText();
      }
    } catch (error) {
      console.warn('Clipboard read failed:', error);
      return null;
    }
  }, [isNative]);

  return {
    share,
    copyToClipboard,
    readFromClipboard
  };
};
