import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sunrise, Sunset, Sparkles, Coffee, Zap, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalizedGreetingProps {
  username?: string | null;
  className?: string;
  lastActiveDate?: Date | null;
  streakDays?: number;
}

/**
 * Time-based personalized greeting with comeback messages and emotional touches
 */
export const PersonalizedGreeting: React.FC<PersonalizedGreetingProps> = ({
  username,
  className,
  lastActiveDate,
  streakDays = 0
}) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    
    // Time-based greeting
    if (hour >= 5 && hour < 12) {
      return {
        text: 'Good morning',
        icon: hour < 7 ? Sunrise : Sun,
        subtext: 'Ready to earn some points today?',
        gradient: 'from-amber-400 to-orange-500'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        text: 'Good afternoon',
        icon: Sun,
        subtext: 'Perfect time for a quick scan!',
        gradient: 'from-sky-400 to-blue-500'
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        text: 'Good evening',
        icon: Sunset,
        subtext: 'Wind down with some easy earnings',
        gradient: 'from-orange-400 to-rose-500'
      };
    } else {
      return {
        text: 'Night owl mode',
        icon: Moon,
        subtext: 'Bonus points for late-night scans!',
        gradient: 'from-indigo-400 to-purple-500'
      };
    }
  }, []);

  const comebackMessage = useMemo(() => {
    if (!lastActiveDate) return null;
    
    const now = new Date();
    const daysSinceActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActive === 0) return null;
    if (daysSinceActive === 1) return 'Welcome back! You missed yesterday.';
    if (daysSinceActive <= 3) return `Welcome back! ${daysSinceActive} days without you.`;
    if (daysSinceActive <= 7) return `We missed you! ${daysSinceActive} days away - let's catch up!`;
    if (daysSinceActive > 7) return `It's been a while! Great to see you again.`;
    return null;
  }, [lastActiveDate]);

  const specialMessage = useMemo(() => {
    // Special streak messages
    if (streakDays === 7) return '🎉 One week streak!';
    if (streakDays === 30) return '🏆 One month streak!';
    if (streakDays === 100) return '💎 100 day legend!';
    
    // Random motivational for returning users
    const isNewSession = !lastActiveDate || (Date.now() - lastActiveDate.getTime()) > 60 * 60 * 1000; // 1 hour
    if (isNewSession && streakDays >= 3) {
      const messages = [
        'Your streak is on fire!',
        'Keep that momentum going!',
        'You\'re crushing it!',
        'Consistency pays off!',
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    
    return null;
  }, [streakDays, lastActiveDate]);

  const displayName = username || 'Explorer';
  const Icon = greeting.icon;

  return (
    <motion.div
      className={cn('space-y-1', className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Main greeting */}
      <div className="flex items-center gap-2">
        <motion.div
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br',
            greeting.gradient
          )}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className="w-4 h-4 text-white" />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {greeting.text}, <span className="text-primary">{displayName}</span>!
          </h1>
        </div>
      </div>
      
      {/* Subtext - comeback message takes priority */}
      {comebackMessage ? (
        <motion.p 
          className="text-sm text-amber-400 flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <PartyPopper className="w-3.5 h-3.5" />
          {comebackMessage}
        </motion.p>
      ) : specialMessage ? (
        <motion.p 
          className="text-sm text-neon-cyan flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {specialMessage}
        </motion.p>
      ) : (
        <motion.p 
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {greeting.subtext}
        </motion.p>
      )}
    </motion.div>
  );
};
