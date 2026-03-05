import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { cn } from '@/lib/utils';
import { MapPin, ShoppingBag, Zap, Trophy, Users, Target } from 'lucide-react';

type EmptyStateType = 'wallet' | 'orders' | 'achievements' | 'transactions' | 'leaderboard' | 'challenges';

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

const DEFAULT_CONFIG: Record<EmptyStateType, {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: React.ElementType;
}> = {
  wallet: {
    title: 'Start earning points',
    description: 'Scan your network to collect points and rewards',
    actionLabel: 'Start Scanning',
    actionHref: '/app',
    icon: MapPin
  },
  orders: {
    title: 'No orders yet',
    description: 'Your eSIM purchases will appear here',
    actionLabel: 'Browse eSIMs',
    actionHref: '/app/shop',
    icon: ShoppingBag
  },
  achievements: {
    title: 'Your first badge awaits!',
    description: 'Earn badges by completing daily challenges and contributions.',
    actionLabel: 'View Challenges',
    actionHref: '/app/challenges',
    icon: Trophy
  },
  transactions: {
    title: 'No activity yet',
    description: 'Your earning history will appear here',
    actionLabel: 'Start Contributing',
    actionHref: '/app',
    icon: Zap
  },
  leaderboard: {
    title: 'Rankings coming soon',
    description: 'First week: rankings appear after 7 days of data.',
    actionLabel: 'Invite Friends',
    actionHref: '/app/invite',
    icon: Users
  },
  challenges: {
    title: 'No active challenges',
    description: 'New challenges coming soon! Keep contributing to unlock.',
    actionLabel: 'Start Earning',
    actionHref: '/app',
    icon: Target
  }
};

/**
 * Reusable empty state component with illustrations and CTAs
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
  className,
  compact = false
}) => {
  const navigate = useNavigate();
  const config = DEFAULT_CONFIG[type];
  
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayAction = action || {
    label: config.actionLabel,
    href: config.actionHref
  };

  const handleAction = () => {
    if (displayAction.onClick) {
      displayAction.onClick();
    } else if (displayAction.href) {
      navigate(displayAction.href);
    }
  };

  if (compact) {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <config.icon className="w-6 h-6 text-primary/60" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{displayTitle}</p>
          <p className="text-xs text-muted-foreground truncate">{displayDescription}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-primary shrink-0"
          onClick={handleAction}
        >
          {displayAction.label} →
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <EmptyStateIllustration type={type} className="mb-4" />
      
      <h3 className="text-lg font-semibold text-foreground mb-1.5">
        {displayTitle}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-5 max-w-[250px]">
        {displayDescription}
      </p>
      
      <Button
        onClick={handleAction}
        variant={displayAction.variant || 'default'}
        className="shadow-lg shadow-primary/20"
      >
        {displayAction.label}
      </Button>
    </motion.div>
  );
};
