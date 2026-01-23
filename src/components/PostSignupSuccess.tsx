import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Flame, Trophy, ChevronRight, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PostSignupSuccessProps {
  username: string;
  onContinue: () => void;
}

export const PostSignupSuccess = memo(({ username, onContinue }: PostSignupSuccessProps) => {
  const navigate = useNavigate();

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-black text-foreground mb-2">
            You're In, {username}! 🎉
          </h1>
          <p className="text-muted-foreground">
            Welcome to the Nomiqa network. Let's get you started.
          </p>
        </motion.div>

        {/* Referral Challenge Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/30 p-6">
            {/* Flame decoration */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-bold text-primary">Genesis Referral Challenge</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">7 days</span>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2">
                Invite Friends → Climb the Leaderboard → Earn Rewards
              </h2>

              <p className="text-sm text-muted-foreground mb-4">
                The top referrers this week win exclusive prizes and bonus tokens. Start inviting now!
              </p>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">2</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-600/20 border-2 border-amber-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-600">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">Top 3 win special prizes</p>
                  <p className="text-xs text-muted-foreground">All referrers earn bonus points</p>
                </div>
              </div>

              <Button 
                onClick={handleViewLeaderboard}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Users className="w-4 h-4" />
                View Leaderboard
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            onClick={onContinue}
            variant="outline"
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Continue to Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
});

PostSignupSuccess.displayName = 'PostSignupSuccess';
