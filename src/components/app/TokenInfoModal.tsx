import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Users, Code, Droplets, Shield, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';
import { TOKENOMICS, TOKEN_ALLOCATION, formatTokens, pointsToUsd } from '@/utils/tokenomics';
import { cn } from '@/lib/utils';

interface TokenInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal explaining the tokenomics and points-to-token conversion
 * Triggered when user taps "Beta" badge or info icon on balance card
 */
export const TokenInfoModal: React.FC<TokenInfoModalProps> = ({ isOpen, onClose }) => {
  const { lightTap } = useHaptics();

  const handleClose = () => {
    lightTap();
    onClose();
  };

  // Allocation data for pie chart visualization
  const allocations = [
    { ...TOKEN_ALLOCATION.userRewards, icon: Users },
    { ...TOKEN_ALLOCATION.ecosystem, icon: Code },
    { ...TOKEN_ALLOCATION.team, icon: Shield },
    { ...TOKEN_ALLOCATION.liquidity, icon: Droplets },
    { ...TOKEN_ALLOCATION.reserve, icon: Coins },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 z-50 max-h-[85vh] overflow-hidden rounded-2xl bg-card border border-border shadow-xl"
            style={{ maxWidth: '500px', margin: '0 auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Token Economy</h2>
                  <p className="text-xs text-muted-foreground">Understanding your rewards</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Conversion Rate */}
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Points = Tokens</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">1:1</span>
                  <span className="text-sm text-muted-foreground">conversion ratio</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Every point you earn converts directly to 1 NOMIQA token. 
                  Estimated value: ${TOKENOMICS.ESTIMATED_TOKEN_VALUE_USD} per token.
                </p>
              </div>

              {/* Total Supply */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Total Supply</h3>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {formatTokens(TOKENOMICS.TOTAL_SUPPLY)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    1 Billion NOMIQA tokens total
                  </p>
                </div>
              </div>

              {/* Allocation Breakdown */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Token Allocation</h3>
                <div className="space-y-2">
                  {allocations.map((item) => {
                    const Icon = item.icon;
                    const isUserRewards = item.percentage === 50;
                    
                    return (
                      <div 
                        key={item.label}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          isUserRewards 
                            ? "bg-primary/10 border-primary/20" 
                            : "bg-card border-border"
                        )}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <Icon 
                            className="w-4 h-4" 
                            style={{ color: item.color.replace('hsl(var(--', '').replace('))', '') === 'primary' 
                              ? 'hsl(var(--primary))' 
                              : item.color 
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                            <span className="text-sm font-semibold text-foreground">{item.percentage}%</span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ delay: 0.2, duration: 0.5 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.color.includes('var(--') 
                                ? 'hsl(var(--primary))' 
                                : item.color 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Rewards Highlight */}
              <div className="bg-gradient-to-br from-success/10 to-transparent rounded-xl p-4 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-foreground">Your Share</span>
                </div>
                <div className="text-2xl font-bold text-success mb-1">
                  {formatTokens(TOKENOMICS.USER_REWARDS_POOL)}
                </div>
                <p className="text-xs text-muted-foreground">
                  500 Million tokens reserved for user rewards — that's 50% of total supply 
                  dedicated to rewarding contributors like you.
                </p>
              </div>

              {/* Beta Notice */}
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Beta Phase</h4>
                    <p className="text-xs text-muted-foreground">
                      We're currently in beta. Your points are being tracked and will convert 
                      to tokens when the NOMIQA token launches. Early contributors may receive 
                      bonus rewards!
                    </p>
                  </div>
                </div>
              </div>

              {/* Learn More Link */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  lightTap();
                  window.open('/token', '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Learn More About NOMIQA Token
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TokenInfoModal;
