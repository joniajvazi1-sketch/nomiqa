import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Eye, Share2, X } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useNativeShare } from '@/hooks/useNativeShare';
import { cn } from '@/lib/utils';

interface ProductContextMenuProps {
  product: Product;
  onQuickAdd: () => void;
  onViewDetails: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Long-press context menu wrapper for product cards
 * Provides native-feeling actions: Quick Add, View Details, Share
 */
export const ProductContextMenu: React.FC<ProductContextMenuProps> = ({
  product,
  onQuickAdd,
  onViewDetails,
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { longPressFeedback, buttonTap, selectionTap } = useEnhancedHaptics();
  const { playPop, playSwoosh } = useEnhancedSounds();
  const { share } = useNativeShare();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      longPressFeedback();
      playPop();
      
      // Calculate menu position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMenuPosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
      }
      
      setIsOpen(true);
    }, 500); // 500ms long press
  }, [longPressFeedback, playPop]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    buttonTap();
    setIsOpen(false);
  }, [buttonTap]);

  const handleQuickAdd = useCallback(() => {
    selectionTap();
    playSwoosh();
    setIsOpen(false);
    onQuickAdd();
  }, [selectionTap, playSwoosh, onQuickAdd]);

  const handleViewDetails = useCallback(() => {
    selectionTap();
    setIsOpen(false);
    onViewDetails();
  }, [selectionTap, onViewDetails]);

  const handleShare = useCallback(async () => {
    selectionTap();
    setIsOpen(false);
    await share({
      title: `${product.country_name} eSIM`,
      text: `Check out this ${product.data_amount} eSIM for ${product.country_name} - only $${product.price_usd}!`,
      url: `https://nomiqa-depin.com/shop?product=${product.id}`
    });
  }, [selectionTap, share, product]);

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />
            
            {/* Context Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed z-50 w-48 rounded-2xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
              style={{
                left: `min(calc(${menuPosition.x}px + ${containerRef.current?.getBoundingClientRect().left || 0}px), calc(100vw - 12rem))`,
                top: `min(calc(${menuPosition.y}px + ${containerRef.current?.getBoundingClientRect().top || 0}px), calc(100vh - 12rem))`
              }}
            >
              {/* Header */}
              <div className="p-3 border-b border-white/10 bg-white/5">
                <p className="text-sm font-semibold text-foreground truncate">{product.country_name}</p>
                <p className="text-xs text-muted-foreground">{product.data_amount} • {product.validity_days}d</p>
              </div>
              
              {/* Actions */}
              <div className="p-1">
                <button
                  onClick={handleQuickAdd}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Quick Add</span>
                </button>
                
                <button
                  onClick={handleViewDetails}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">View Details</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Share</span>
                </button>
              </div>
              
              {/* Close hint */}
              <div className="p-2 border-t border-white/10 bg-white/5">
                <p className="text-[10px] text-muted-foreground text-center">Tap outside to close</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
