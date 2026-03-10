import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, MapPin, ShoppingCart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'earning' | 'purchase' | 'milestone' | 'joined';
  username: string;
  value?: number;
  location?: string;
  timestamp: Date;
}

// Simulated activity data (in production, this would come from real-time subscriptions)
const SAMPLE_USERNAMES = [
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn',
  'Drew', 'Blake', 'Avery', 'Skyler', 'Jamie', 'Reese', 'Phoenix', 'Sage'
];

const SAMPLE_LOCATIONS = [
  'Tokyo', 'Paris', 'London', 'NYC', 'Berlin', 'Sydney', 'Singapore', 'Dubai',
  'Toronto', 'Seoul', 'Barcelona', 'Amsterdam', 'Mumbai', 'Bangkok', 'Istanbul'
];

const generateActivity = (): Activity => {
  const types: Activity['type'][] = ['earning', 'purchase', 'milestone', 'joined'];
  const type = types[Math.floor(Math.random() * types.length)];
  const username = SAMPLE_USERNAMES[Math.floor(Math.random() * SAMPLE_USERNAMES.length)];
  const location = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];

  return {
    id: Math.random().toString(36).slice(2),
    type,
    username: username.slice(0, 3) + '***',
    value: type === 'earning' ? Math.floor(Math.random() * 50) + 5 : 
           type === 'milestone' ? Math.floor(Math.random() * 500) + 100 : undefined,
    location: type === 'earning' || type === 'purchase' ? location : undefined,
    timestamp: new Date(),
  };
};

interface SocialProofIndicatorProps {
  className?: string;
  compact?: boolean;
}

export const SocialProofIndicator = ({ className, compact = false }: SocialProofIndicatorProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeUsers, setActiveUsers] = useState(Math.floor(Math.random() * 200) + 150);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Generate initial activities
  useEffect(() => {
    const initial = Array.from({ length: 5 }, generateActivity);
    setActivities(initial);
  }, []);

  // Rotate through activities
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % Math.max(activities.length, 1));
      
      // Occasionally add new activity
      if (Math.random() > 0.7) {
        setActivities(prev => [...prev.slice(-9), generateActivity()]);
      }
      
      // Randomly fluctuate active users
      setActiveUsers(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activities.length]);

  const currentActivity = activities[currentIndex];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'earning': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'purchase': return <ShoppingCart className="w-3.5 h-3.5 text-green-500" />;
      case 'milestone': return <TrendingUp className="w-3.5 h-3.5 text-purple-500" />;
      case 'joined': return <Users className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'earning':
        return `${activity.username} earned ${activity.value} pts`;
      case 'purchase':
        return `${activity.username} bought eSIM in ${activity.location}`;
      case 'milestone':
        return `${activity.username} reached ${activity.value} pts!`;
      case 'joined':
        return `${activity.username} just joined`;
    }
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20",
        className
      )}>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-green-400">
          {activeUsers.toLocaleString()} users earning now
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Activity</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-medium text-green-400">
            {activeUsers.toLocaleString()} active
          </span>
        </div>
      </div>

      {/* Activity feed */}
      <div className="relative h-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentActivity && (
            <motion.div
              key={currentActivity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center">
                {getActivityIcon(currentActivity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {getActivityText(currentActivity)}
                </p>
              </div>
              {currentActivity.location && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {currentActivity.location}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activity dots indicator */}
      <div className="flex justify-center gap-1 mt-3">
        {activities.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              i === currentIndex % 5 ? "bg-primary" : "bg-white/20"
            )}
          />
        ))}
      </div>
    </div>
  );
};

// Compact toast-style indicator
export const SocialProofToast = () => {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showActivity = () => {
      setActivity(generateActivity());
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    // Show first activity after a delay
    const initialTimeout = setTimeout(showActivity, 5000);
    
    // Show subsequent activities periodically
    const interval = setInterval(showActivity, 15000 + Math.random() * 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'earning': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'purchase': return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'milestone': return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'joined': return <Users className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'earning':
        return `${activity.username} just earned ${activity.value} pts in ${activity.location}`;
      case 'purchase':
        return `${activity.username} purchased an eSIM for ${activity.location}`;
      case 'milestone':
        return `${activity.username} reached ${activity.value} total pts!`;
      case 'joined':
        return `${activity.username} just joined Nomiqa`;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && activity && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-28 left-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-xl max-w-[90vw]"
        >
          <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          <p className="text-sm text-foreground truncate">
            {getActivityText(activity)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
