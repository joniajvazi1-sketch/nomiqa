import React, { useMemo } from 'react';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalizedGreetingProps {
  username?: string | null;
  className?: string;
  lastActiveDate?: Date | null;
  streakDays?: number;
}

/**
 * Simple time-based greeting - professional, no animations
 */
export const PersonalizedGreeting: React.FC<PersonalizedGreetingProps> = ({
  username,
  className,
  streakDays = 0
}) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', icon: hour < 7 ? Sunrise : Sun };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon', icon: Sun };
    } else if (hour >= 17 && hour < 21) {
      return { text: 'Good evening', icon: Sunset };
    } else {
      return { text: 'Good evening', icon: Moon };
    }
  }, []);

  const displayName = username || 'there';
  const Icon = greeting.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-foreground">
          {greeting.text}, {displayName}
        </h1>
        {streakDays >= 3 && (
          <p className="text-xs text-muted-foreground">
            {streakDays} day streak
          </p>
        )}
      </div>
    </div>
  );
};
