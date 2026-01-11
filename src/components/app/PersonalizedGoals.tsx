import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, Plus, Check, Edit2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  goal_type: 'daily' | 'weekly';
  target_points: number;
  current_points: number;
  completed: boolean;
  period_start: string;
}

interface PersonalizedGoalsProps {
  userId: string;
  currentPoints?: number;
  compact?: boolean;
}

const GOAL_PRESETS = {
  daily: [50, 100, 150, 200],
  weekly: [300, 500, 750, 1000],
};

export const PersonalizedGoals = ({ userId, currentPoints = 0, compact = false }: PersonalizedGoalsProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingType, setEditingType] = useState<'daily' | 'weekly'>('daily');
  const { successPattern, buttonTap } = useEnhancedHaptics();
  const { playSuccess, playCelebration } = useEnhancedSounds();

  const fetchGoals = useCallback(async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Filter to current period goals
      const currentGoals = (data || []).filter(goal => {
        const goalDate = new Date(goal.period_start);
        if (goal.goal_type === 'daily') {
          return goalDate.toDateString() === today.toDateString();
        } else {
          return goalDate >= startOfWeek;
        }
      });

      setGoals(currentGoals as Goal[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Check for goal completion when currentPoints changes
  useEffect(() => {
    goals.forEach(async goal => {
      if (!goal.completed && currentPoints >= goal.target_points) {
        // Update goal as completed
        await supabase
          .from('user_goals')
          .update({ completed: true, current_points: currentPoints })
          .eq('id', goal.id);

        setGoals(prev => prev.map(g => 
          g.id === goal.id ? { ...g, completed: true, current_points: currentPoints } : g
        ));

        successPattern();
        playCelebration();
        toast.success(`${goal.goal_type === 'daily' ? 'Daily' : 'Weekly'} goal completed! 🎉`);
      }
    });
  }, [currentPoints, goals, successPattern, playCelebration]);

  const createGoal = async (type: 'daily' | 'weekly', target: number) => {
    buttonTap();
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const periodStart = type === 'daily' ? today : startOfWeek.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: userId,
          goal_type: type,
          target_points: target,
          current_points: currentPoints,
          completed: currentPoints >= target,
          period_start: periodStart,
        }, {
          onConflict: 'user_id,goal_type,period_start',
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => {
        const filtered = prev.filter(g => g.goal_type !== type);
        return [...filtered, data as Goal];
      });

      playSuccess();
      toast.success(`${type === 'daily' ? 'Daily' : 'Weekly'} goal set!`);
      setShowEditor(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to set goal');
    }
  };

  const dailyGoal = goals.find(g => g.goal_type === 'daily');
  const weeklyGoal = goals.find(g => g.goal_type === 'weekly');

  if (loading) {
    return (
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-3">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-full" />
          <div className="flex-1 h-4 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  // COMPACT MODE - Single inline row
  if (compact) {
    const goal = dailyGoal || weeklyGoal;
    
    if (!goal) {
      // No goal set - show set goal prompt
      return (
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-dashed border-white/[0.15] w-full active:scale-[0.98] transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground flex-1 text-left">Set a daily goal</span>
          <Plus className="w-4 h-4 text-primary" />
          
          {/* Goal Editor Modal */}
          <GoalEditorModal 
            showEditor={showEditor}
            setShowEditor={setShowEditor}
            editingType={editingType}
            setEditingType={setEditingType}
            createGoal={createGoal}
          />
        </button>
      );
    }

    const progress = Math.min((currentPoints / goal.target_points) * 100, 100);

    return (
      <>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] w-full active:scale-[0.98] transition-transform"
        >
          {/* Circular progress */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-white/10"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={94.2}
                strokeDashoffset={94.2 * (1 - progress / 100)}
                className={goal.completed ? "text-green-500" : "text-primary"}
              />
            </svg>
            {goal.completed ? (
              <Check className="absolute inset-0 m-auto w-4 h-4 text-green-500" />
            ) : (
              <Target className="absolute inset-0 m-auto w-4 h-4 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-foreground">
              {goal.goal_type === 'daily' ? 'Daily' : 'Weekly'}: {currentPoints}/{goal.target_points} pts
            </div>
            <div className="text-[10px] text-muted-foreground">
              {goal.completed ? '✓ Completed!' : `${Math.round(progress)}% complete`}
            </div>
          </div>
          
          {goal.completed ? (
            <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium">
              Done!
            </div>
          ) : (
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Goal Editor Modal */}
        <GoalEditorModal 
          showEditor={showEditor}
          setShowEditor={setShowEditor}
          editingType={editingType}
          setEditingType={setEditingType}
          createGoal={createGoal}
        />
      </>
    );
  }

  // FULL MODE - Card with both goals
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Your Goals</h2>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-1 text-xs text-primary"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
      </div>

      {/* Goals display */}
      <div className="grid grid-cols-2 gap-2">
        <GoalCard
          goal={dailyGoal}
          type="daily"
          currentPoints={currentPoints}
          onAdd={() => { setEditingType('daily'); setShowEditor(true); }}
        />
        <GoalCard
          goal={weeklyGoal}
          type="weekly"
          currentPoints={currentPoints}
          onAdd={() => { setEditingType('weekly'); setShowEditor(true); }}
        />
      </div>

      {/* Goal Editor Modal */}
      <GoalEditorModal 
        showEditor={showEditor}
        setShowEditor={setShowEditor}
        editingType={editingType}
        setEditingType={setEditingType}
        createGoal={createGoal}
      />
    </div>
  );
};

// Goal Editor Modal Component
const GoalEditorModal = ({
  showEditor,
  setShowEditor,
  editingType,
  setEditingType,
  createGoal,
}: {
  showEditor: boolean;
  setShowEditor: (show: boolean) => void;
  editingType: 'daily' | 'weekly';
  setEditingType: (type: 'daily' | 'weekly') => void;
  createGoal: (type: 'daily' | 'weekly', target: number) => void;
}) => (
  <AnimatePresence>
    {showEditor && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowEditor(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xs bg-card rounded-2xl p-4 shadow-xl border border-border max-h-[70vh]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Set Goal</h3>
            <button onClick={() => setShowEditor(false)} className="p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['daily', 'weekly'] as const).map(type => (
              <button
                key={type}
                onClick={() => setEditingType(type)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                  editingType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/[0.05] text-muted-foreground"
                )}
              >
                {type === 'daily' ? 'Daily' : 'Weekly'}
              </button>
            ))}
          </div>

          {/* Preset options - 2x2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {GOAL_PRESETS[editingType].map(target => (
              <button
                key={target}
                onClick={() => createGoal(editingType, target)}
                className="py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors active:scale-95"
              >
                <div className="text-lg font-bold text-foreground">{target}</div>
                <div className="text-[10px] text-muted-foreground">points</div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Sub-component for individual goal cards (full mode)
const GoalCard = ({ 
  goal, 
  type, 
  currentPoints, 
  onAdd 
}: { 
  goal?: Goal; 
  type: 'daily' | 'weekly'; 
  currentPoints: number;
  onAdd: () => void;
}) => {
  if (!goal) {
    return (
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors min-h-[80px]"
      >
        <Plus className="w-5 h-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Set {type}
        </span>
      </button>
    );
  }

  const progress = Math.min((currentPoints / goal.target_points) * 100, 100);

  return (
    <div className={cn(
      "relative p-3 rounded-xl border overflow-hidden",
      goal.completed
        ? "bg-green-500/10 border-green-500/30"
        : "bg-white/[0.03] border-white/[0.08]"
    )}>
      {/* Progress background */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-500",
          goal.completed ? "bg-green-500/20" : "bg-primary/10"
        )}
        style={{ width: `${progress}%` }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            {type}
          </span>
          {goal.completed && (
            <Check className="w-3.5 h-3.5 text-green-500" />
          )}
        </div>

        <div className="text-xl font-bold text-foreground mb-0.5">
          {goal.target_points}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {currentPoints} / {goal.target_points}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn(
              "h-full rounded-full",
              goal.completed ? "bg-green-500" : "bg-primary"
            )}
          />
        </div>
      </div>
    </div>
  );
};
