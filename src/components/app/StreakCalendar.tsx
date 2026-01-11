import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCalendarProps {
  checkins: { date: string; points: number }[];
  currentStreak: number;
  onClose?: () => void;
}

export const StreakCalendar = ({ checkins, currentStreak, onClose }: StreakCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const checkinDates = useMemo(() => {
    return new Set(checkins.map(c => c.date));
  }, [checkins]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = 
    currentMonth.getMonth() === today.getMonth() && 
    currentMonth.getFullYear() === today.getFullYear();

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    if (next <= today) {
      setCurrentMonth(next);
    }
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-2xl border border-border p-4 shadow-xl max-w-[300px] w-full"
    >
      {/* Header - compact */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-sm text-foreground">{currentStreak} Day Streak</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Month navigation - compact */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm text-foreground">{monthName}</span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            isCurrentMonth ? "opacity-30" : "hover:bg-muted"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - smaller cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = formatDateKey(day);
          const hasCheckin = checkinDates.has(dateKey);
          const isToday = isCurrentMonth && day === today.getDate();
          const isFuture = isCurrentMonth && day > today.getDate();

          return (
            <motion.div
              key={day}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.005 }}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-xs font-medium relative",
                hasCheckin && "bg-gradient-to-br from-orange-500 to-amber-500 text-white",
                isToday && !hasCheckin && "ring-1 ring-primary",
                isFuture && "opacity-30",
                !hasCheckin && !isToday && !isFuture && "text-muted-foreground"
              )}
            >
              {hasCheckin ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="text-[10px]">{day}</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Stats footer - compact */}
      <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-1 text-center">
        <div>
          <div className="text-sm font-bold text-foreground">{checkins.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Days</div>
        </div>
        <div>
          <div className="text-sm font-bold text-orange-500">{currentStreak}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Streak</div>
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">
            {checkins.reduce((sum, c) => sum + c.points, 0)}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Pts</div>
        </div>
      </div>
    </motion.div>
  );
};
