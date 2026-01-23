import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/TranslationContext";
import { Bot } from "lucide-react";

/**
 * Cute animated robot bubble that appears while scrolling
 * Shows a localized greeting and triggers the chatbot when clicked
 */
export const ChatbotBubble = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // WebLayout uses a fixed scroll container, so check both window and the container
      const scrollContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
      const scrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      
      // Show after scrolling 200px, hide if dismissed
      if (scrollY > 200 && !hasBeenDismissed) {
        setIsVisible(true);
      } else if (scrollY <= 50) {
        setIsVisible(false);
        setHasBeenDismissed(false); // Reset when back at top
      }
    };

    // Listen to both window and the scroll container
    const scrollContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    scrollContainer?.addEventListener("scroll", handleScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      scrollContainer?.removeEventListener("scroll", handleScroll);
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
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-24 z-40 cursor-pointer group"
          onClick={handleClick}
        >
          {/* Speech bubble */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-full right-0 mb-2 mr-2"
          >
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-xl max-w-[200px]">
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/60 hover:text-white text-xs transition-colors"
              >
                ×
              </button>
              <p className="text-sm text-white font-medium leading-snug">
                {t("chatbotBubbleGreeting")}
              </p>
            </div>
          </motion.div>

          {/* Animated robot */}
          <motion.div
            animate={{ 
              y: [0, -4, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl scale-150 opacity-50" />
            
            {/* Robot container */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white/20 group-hover:scale-110 transition-transform">
              {/* Robot face */}
              <div className="relative">
                <Bot className="w-7 h-7 text-white" />
                
                {/* Blinking eyes overlay */}
                <motion.div
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ 
                    duration: 0.15,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                  className="absolute top-[5px] left-[5px] w-[18px] h-[4px] flex justify-between"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </motion.div>
              </div>
            </div>

            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-green-500"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
