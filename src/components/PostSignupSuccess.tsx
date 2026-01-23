import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostSignupSuccessProps {
  username: string;
  onContinue: () => void;
}

export const PostSignupSuccess = memo(({ username, onContinue }: PostSignupSuccessProps) => {
  const navigate = useNavigate();


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

        {/* Referral CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/30 p-6">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">Invite Friends & Earn</span>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2">
                Share Nomiqa → Earn Rewards
              </h2>

              <p className="text-sm text-muted-foreground mb-4">
                Invite friends and earn bonus points for every signup. Start inviting now!
              </p>

              <Button 
                onClick={() => navigate('/affiliate')}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Users className="w-4 h-4" />
                Get Your Invite Link
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
