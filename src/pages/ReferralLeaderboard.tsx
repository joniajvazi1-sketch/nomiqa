import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Clock, Users, Flame, ChevronRight, Share2, TrendingUp } from 'lucide-react';
import { useReferralLeaderboard } from '@/hooks/useReferralLeaderboard';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return null;
};

const getRankStyle = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40';
  if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/40';
  if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/40';
  return 'bg-card/60 border-border/50';
};

const LeaderboardEntry = memo(({ entry, index }: { entry: any; index: number }) => {
  const isTopThree = entry.rank <= 3;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all',
        getRankStyle(entry.rank),
        entry.isCurrentUser && 'ring-2 ring-primary/50'
      )}
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-10 h-10">
        {getRankIcon(entry.rank) || (
          <span className={cn(
            'text-lg font-bold',
            entry.rank <= 10 ? 'text-primary' : 'text-muted-foreground'
          )}>
            {entry.rank}
          </span>
        )}
      </div>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-semibold truncate',
          entry.isCurrentUser ? 'text-primary' : 'text-foreground'
        )}>
          {entry.username}
          {entry.isCurrentUser && (
            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
          )}
        </p>
      </div>

      {/* Referrals Count */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className={cn(
          'font-bold text-lg',
          isTopThree ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {entry.referrals_count}
        </span>
      </div>
    </motion.div>
  );
});
LeaderboardEntry.displayName = 'LeaderboardEntry';

const ReferralLeaderboard = () => {
  const { entries, userRank, loading, daysRemaining, dailyRegistrations, totalWeeklyRegistrations, refresh } = useReferralLeaderboard();

  const handleShare = async () => {
    const shareText = userRank 
      ? `I'm #${userRank.rank} on the Nomiqa Genesis Referral Challenge! 🔥 Join me and earn rewards.`
      : `Join the Nomiqa Genesis Referral Challenge and earn rewards! 🔥`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nomiqa Referral Challenge',
          text: shareText,
          url: window.location.href,
        });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
    }
  };

  return (
    <>
      <SEO page="home" />
      <Navbar />
      
      <main className="min-h-screen bg-background pt-20 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="container px-4 py-12 relative z-10">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-6"
              >
                <Flame className="w-5 h-5 animate-pulse" />
                <span className="font-semibold">Genesis Referral Challenge</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-foreground mb-4"
              >
                Invite Friends. Climb the Ranks. Earn Rewards.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground mb-6"
              >
                The top referrers this week win exclusive prizes and bonus tokens.
              </motion.p>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-card/80 border border-border backdrop-blur-sm">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground text-sm">Ends in:</span>
                  <span className="font-bold text-lg text-foreground">{daysRemaining} days</span>
                </div>
                
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-card/80 border border-border backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-muted-foreground text-sm">This week:</span>
                  <span className="font-bold text-lg text-green-500">{totalWeeklyRegistrations} signups</span>
                </div>

                {dailyRegistrations > 0 && (
                  <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
                    <Users className="w-5 h-5 text-green-500" />
                    <span className="text-muted-foreground text-sm">Today:</span>
                    <span className="font-bold text-lg text-green-500">+{dailyRegistrations}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Your Rank Card (if logged in and has rank) */}
            {userRank && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="max-w-md mx-auto mb-8"
              >
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your Current Rank</p>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="text-5xl font-black text-primary">#{userRank.rank}</span>
                    {getRankIcon(userRank.rank)}
                  </div>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{userRank.referrals_count}</span> referrals this week
                  </p>
                  <Button 
                    onClick={handleShare}
                    variant="outline" 
                    className="mt-4 gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share My Rank
                  </Button>
                </div>
              </motion.div>
            )}

            {/* CTA for non-participants */}
            {!userRank && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-md mx-auto mb-8 text-center"
              >
              <div className="p-6 rounded-2xl bg-card/80 border border-border backdrop-blur-sm">
                  <p className="text-muted-foreground mb-4">Ready to compete? Start referring friends to join the leaderboard!</p>
                  <Link to="/affiliate">
                    <Button className="gap-2">
                      Get Your Invite Link
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Leaderboard */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Top Referrers This Week
                </h2>
                <Button variant="ghost" size="sm" onClick={refresh}>
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg text-muted-foreground mb-2">No referrals yet this week</p>
                  <p className="text-sm text-muted-foreground/70">Be the first to climb the leaderboard!</p>
                  <Link to="/affiliate">
                    <Button className="mt-6 gap-2">
                      Start Inviting
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <LeaderboardEntry key={entry.rank} entry={entry} index={index} />
                  ))}
                </div>
              )}
            </div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl mx-auto mt-16 text-center"
            >
              <h3 className="text-lg font-bold text-foreground mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-card/60 border border-border">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Share your unique invite link</p>
                </div>
                <div className="p-4 rounded-xl bg-card/60 border border-border">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Friends sign up using your link</p>
                </div>
                <div className="p-4 rounded-xl bg-card/60 border border-border">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Climb the ranks & earn rewards</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ReferralLeaderboard;
