import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateIllustrationProps {
  type: 'wallet' | 'orders' | 'transactions' | 'challenges';
  className?: string;
}

/**
 * Animated SVG illustrations for empty states
 * Lightweight CSS/SVG animations for premium feel
 */
export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({ 
  type, 
  className 
}) => {
  const illustrations = {
    wallet: <WalletIllustration />,
    orders: <OrdersIllustration />,
    transactions: <TransactionsIllustration />,
    challenges: <ChallengesIllustration />
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {illustrations[type]}
    </div>
  );
};

// Animated wallet illustration
const WalletIllustration: React.FC = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Background circle with glow */}
    <motion.circle
      cx="60"
      cy="60"
      r="50"
      fill="url(#walletGradient)"
      opacity="0.15"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Wallet body */}
    <motion.rect
      x="25"
      y="40"
      width="70"
      height="45"
      rx="8"
      fill="hsl(var(--primary))"
      opacity="0.2"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      animate={{ y: [40, 38, 40] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Wallet flap */}
    <motion.path
      d="M25 50 L25 45 C25 40 30 35 35 35 L85 35 C90 35 95 40 95 45 L95 50"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      fill="none"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Coin 1 - floating */}
    <motion.circle
      cx="50"
      cy="62"
      r="8"
      fill="hsl(var(--neon-cyan))"
      opacity="0.8"
      animate={{ 
        y: [-5, 5, -5],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Coin 2 - floating offset */}
    <motion.circle
      cx="70"
      cy="58"
      r="6"
      fill="hsl(var(--primary))"
      opacity="0.6"
      animate={{ 
        y: [5, -5, 5],
        opacity: [0.6, 0.9, 0.6]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    />
    
    {/* Sparkle effects */}
    <motion.circle
      cx="85"
      cy="45"
      r="2"
      fill="hsl(var(--neon-cyan))"
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0.5, 1.2, 0.5]
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.circle
      cx="35"
      cy="55"
      r="1.5"
      fill="hsl(var(--primary))"
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0.5, 1.2, 0.5]
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
    />
    
    <defs>
      <radialGradient id="walletGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--neon-cyan))" />
      </radialGradient>
    </defs>
  </motion.svg>
);

// Animated orders/package illustration
const OrdersIllustration: React.FC = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Background glow */}
    <motion.circle
      cx="60"
      cy="60"
      r="50"
      fill="url(#ordersGradient)"
      opacity="0.1"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Package box - 3D effect */}
    <motion.path
      d="M60 30 L90 45 L90 75 L60 90 L30 75 L30 45 Z"
      fill="hsl(var(--primary))"
      opacity="0.15"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Package top */}
    <motion.path
      d="M60 30 L90 45 L60 60 L30 45 Z"
      fill="hsl(var(--primary))"
      opacity="0.25"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Center line on top */}
    <motion.line
      x1="60"
      y1="30"
      x2="60"
      y2="60"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      opacity="0.5"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Ribbon */}
    <motion.path
      d="M45 45 L60 52 L75 45"
      stroke="hsl(var(--neon-cyan))"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Floating stars */}
    <motion.path
      d="M95 35 L97 40 L102 40 L98 44 L100 49 L95 46 L90 49 L92 44 L88 40 L93 40 Z"
      fill="hsl(var(--neon-cyan))"
      opacity="0.7"
      animate={{ 
        rotate: [0, 180, 360],
        scale: [0.8, 1, 0.8]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
    
    <defs>
      <radialGradient id="ordersGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
  </motion.svg>
);

// Animated achievements/trophy illustration
const AchievementsIllustration: React.FC = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Glow behind trophy */}
    <motion.circle
      cx="60"
      cy="55"
      r="35"
      fill="url(#trophyGlow)"
      opacity="0.2"
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.3, 0.2]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Trophy cup */}
    <motion.path
      d="M40 35 L45 65 L55 70 L55 80 L45 85 L75 85 L65 80 L65 70 L75 65 L80 35 Z"
      fill="hsl(38, 95%, 55%)"
      opacity="0.9"
      stroke="hsl(38, 95%, 45%)"
      strokeWidth="2"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Trophy handles */}
    <motion.path
      d="M40 40 C25 40 25 55 40 55"
      stroke="hsl(38, 95%, 45%)"
      strokeWidth="3"
      fill="none"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.path
      d="M80 40 C95 40 95 55 80 55"
      stroke="hsl(38, 95%, 45%)"
      strokeWidth="3"
      fill="none"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Star on trophy */}
    <motion.path
      d="M60 42 L63 50 L72 50 L65 56 L68 64 L60 58 L52 64 L55 56 L48 50 L57 50 Z"
      fill="white"
      opacity="0.9"
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.9, 1, 0.9]
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Sparkles */}
    <motion.circle
      cx="30"
      cy="45"
      r="3"
      fill="hsl(var(--neon-cyan))"
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0.5, 1.5, 0.5]
      }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.circle
      cx="90"
      cy="50"
      r="2"
      fill="hsl(38, 95%, 55%)"
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0.5, 1.5, 0.5]
      }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
    />
    <motion.circle
      cx="50"
      cy="30"
      r="2"
      fill="hsl(var(--primary))"
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0.5, 1.5, 0.5]
      }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
    />
    
    <defs>
      <radialGradient id="trophyGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(38, 95%, 55%)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
  </motion.svg>
);

// Animated transactions illustration
const TransactionsIllustration: React.FC = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Background */}
    <motion.circle
      cx="60"
      cy="60"
      r="45"
      fill="url(#txGradient)"
      opacity="0.1"
    />
    
    {/* List items - staggered */}
    {[0, 1, 2].map((i) => (
      <motion.g key={i}>
        <motion.rect
          x="30"
          y={35 + i * 22}
          width="60"
          height="16"
          rx="4"
          fill="hsl(var(--primary))"
          opacity={0.15 - i * 0.03}
          initial={{ x: -20, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 0.15 - i * 0.03,
          }}
          transition={{ delay: i * 0.15, duration: 0.4 }}
        />
        <motion.rect
          x="35"
          y={39 + i * 22}
          width="8"
          height="8"
          rx="4"
          fill="hsl(var(--neon-cyan))"
          opacity={0.6 - i * 0.1}
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        />
        <motion.rect
          x="48"
          y={40 + i * 22}
          width={35 - i * 5}
          height="3"
          rx="1.5"
          fill="hsl(var(--muted-foreground))"
          opacity="0.3"
        />
        <motion.rect
          x="48"
          y={46 + i * 22}
          width="20"
          height="2"
          rx="1"
          fill="hsl(var(--muted-foreground))"
          opacity="0.15"
        />
      </motion.g>
    ))}
    
    {/* Empty indicator */}
    <motion.text
      x="60"
      y="105"
      textAnchor="middle"
      fill="hsl(var(--muted-foreground))"
      fontSize="10"
      opacity="0.5"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      No activity yet
    </motion.text>
    
    <defs>
      <radialGradient id="txGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
  </motion.svg>
);

// Animated leaderboard illustration
const LeaderboardIllustration: React.FC = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Background glow */}
    <motion.circle
      cx="60"
      cy="60"
      r="45"
      fill="url(#leaderboardGradient)"
      opacity="0.15"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Podium bars */}
    {[
      { x: 25, height: 35, y: 55, delay: 0, color: 'hsl(var(--muted-foreground))' },
      { x: 50, height: 50, y: 40, delay: 0.1, color: 'hsl(var(--primary))' },
      { x: 75, height: 28, y: 62, delay: 0.2, color: 'hsl(var(--muted-foreground))' }
    ].map((bar, i) => (
      <motion.rect
        key={i}
        x={bar.x}
        y={bar.y}
        width="20"
        height={bar.height}
        rx="4"
        fill={bar.color}
        opacity={i === 1 ? 0.8 : 0.3}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: bar.delay, duration: 0.4, ease: 'easeOut' }}
        style={{ transformOrigin: 'bottom' }}
      />
    ))}
    
    {/* Crown on winner */}
    <motion.path
      d="M55 35 L60 28 L65 35 L62 35 L60 32 L58 35 Z"
      fill="hsl(38, 95%, 55%)"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Rank numbers */}
    <motion.text x="35" y="80" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" opacity="0.5">2</motion.text>
    <motion.text x="60" y="65" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="12" fontWeight="bold">1</motion.text>
    <motion.text x="85" y="82" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" opacity="0.5">3</motion.text>
    
    {/* Empty state text */}
    <motion.text
      x="60"
      y="105"
      textAnchor="middle"
      fill="hsl(var(--muted-foreground))"
      fontSize="10"
      opacity="0.5"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      Be the first!
    </motion.text>
    
    <defs>
      <radialGradient id="leaderboardGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
  </motion.svg>
);

// Animated challenges illustration
const ChallengesIllustration: React.FC = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Background */}
    <motion.circle
      cx="60"
      cy="60"
      r="45"
      fill="url(#challengesGradient)"
      opacity="0.1"
    />
    
    {/* Target circles */}
    <motion.circle
      cx="60"
      cy="55"
      r="35"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      fill="none"
      opacity="0.2"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.circle
      cx="60"
      cy="55"
      r="25"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      fill="none"
      opacity="0.4"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
    />
    <motion.circle
      cx="60"
      cy="55"
      r="15"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      fill="none"
      opacity="0.6"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
    />
    
    {/* Center bullseye */}
    <motion.circle
      cx="60"
      cy="55"
      r="6"
      fill="hsl(var(--primary))"
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Flag at center */}
    <motion.path
      d="M60 55 L60 40 L72 45 L60 50"
      fill="hsl(var(--neon-cyan))"
      opacity="0.8"
      animate={{ rotate: [-5, 5, -5] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '60px 55px' }}
    />
    
    {/* Text */}
    <motion.text
      x="60"
      y="105"
      textAnchor="middle"
      fill="hsl(var(--muted-foreground))"
      fontSize="10"
      opacity="0.5"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      No challenges yet
    </motion.text>
    
    <defs>
      <radialGradient id="challengesGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
  </motion.svg>
);

export default EmptyStateIllustration;
