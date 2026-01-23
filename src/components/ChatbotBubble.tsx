import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/TranslationContext";
import { Bot } from "lucide-react";

/**
 * Premium animated assistant bubble that appears while scrolling
 * Matches the website's glassmorphism aesthetic
 * Shows a localized greeting and triggers the chatbot when clicked
 */
export const ChatbotBubble = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Cache the scroll container reference to avoid repeated DOM queries (fixes forced reflow)
    let scrollContainer: Element | null = null;
    let rafId: number | null = null;
    
    const handleScroll = () => {
      // Use cached reference, only query once
      if (!scrollContainer) {
        scrollContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
      }
      
      const scrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const scrollHeight = scrollContainer ? scrollContainer.scrollHeight : document.body.scrollHeight;
      const clientHeight = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
      
      // Calculate distance from bottom
      const distanceFromBottom = scrollHeight - scrollY - clientHeight;
      
      // Hide when near footer (last 600px of page)
      const isNearFooter = distanceFromBottom < 600;
      
      // Show after scrolling 200px, hide if dismissed or near footer
      if (scrollY > 200 && !hasBeenDismissed && !isNearFooter) {
        setIsVisible(true);
      } else if (scrollY <= 50 || isNearFooter) {
        if (scrollY <= 50) {
          setHasBeenDismissed(false); // Reset when back at top
        }
        setIsVisible(false);
      }
    };

    // Throttle scroll handler with rAF to prevent forced reflow
    const throttledScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };

    // Defer initial setup to avoid blocking FCP
    const timeoutId = setTimeout(() => {
      scrollContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
      
      window.addEventListener("scroll", throttledScroll, { passive: true });
      scrollContainer?.addEventListener("scroll", throttledScroll, { passive: true });
      
      // Check initial scroll position
      handleScroll();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", throttledScroll);
      scrollContainer?.removeEventListener("scroll", throttledScroll);
    };
  }, [hasBeenDismissed]);

  const handleClick = () => {
    // Trigger the main chatbot
    const chatbotButton = document.querySelector('[aria-label="Open support chat"]');
    if (chatbotButton instanceof HTMLElement) {
      chatbotButton.click();
    }
    setHasBeenDismissed(true);
    setIsVisible(false);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasBeenDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-32 right-4 md:bottom-28 md:right-6 z-40 cursor-pointer group"
          onClick={handleClick}
        >
          {/* Speech bubble */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-full right-0 mb-3"
          >
            <div className="relative bg-white/[0.08] backdrop-blur-2xl border border-white/[0.15] rounded-2xl rounded-br-md px-4 py-3 shadow-2xl shadow-black/20 max-w-[180px]">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-violet/10 rounded-2xl rounded-br-md pointer-events-none" />
              
              <button
                onClick={handleDismiss}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/[0.1] hover:bg-white/[0.2] backdrop-blur-xl border border-white/[0.15] flex items-center justify-center text-white/50 hover:text-white text-[10px] transition-all duration-200"
              >
                ×
              </button>
              <p className="text-[13px] text-white/90 font-light leading-relaxed relative z-10">
                {t("chatbotBubbleGreeting")}
              </p>
              
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white/[0.08] border-r border-b border-white/[0.15] transform rotate-45" />
            </div>
          </motion.div>

          {/* Premium glassmorphic robot */}
          <div className="relative">
            {/* Subtle glow */}
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-neon-cyan/20 rounded-2xl blur-xl scale-150" 
            />
            
            {/* Robot container - glassmorphic style */}
            <motion.div 
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-12 h-12 rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/[0.15] flex items-center justify-center shadow-xl shadow-black/10 group-hover:border-neon-cyan/30 group-hover:bg-white/[0.1] transition-all duration-300"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 via-transparent to-neon-violet/20 rounded-2xl pointer-events-none" />
              
              {/* Robot icon with subtle twinkle */}
              <motion.div
                animate={{ 
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <Bot className="w-6 h-6 text-neon-cyan" />
              </motion.div>
            </motion.div>

            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background shadow-lg shadow-emerald-400/30">
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-emerald-400"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
