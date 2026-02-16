import React, { useEffect, useState } from 'react';
import { Users, Wifi, WifiOff, ChevronRight, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';

interface TeamMember {
  user_id: string;
  username: string;
  isActive: boolean;
  lastActiveAt: string | null;
  commissionPoints: number;
}

interface TeamActivityCardProps {
  userId: string | null;
}

/**
 * Displays the user's invited team members and their live contribution status
 * Also shows how many commission points each teammate has earned for the referrer
 */
export const TeamActivityCard: React.FC<TeamActivityCardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { lightTap } = useHaptics();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchTeamActivity = async () => {
      try {
        const { data: affiliate } = await supabase
          .from('affiliates_safe')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!affiliate?.id) {
          setLoading(false);
          return;
        }

        const { data: referrals } = await supabase
          .from('affiliate_referrals')
          .select('registered_user_id')
          .eq('affiliate_id', affiliate.id)
          .not('registered_user_id', 'is', null)
          .limit(20);

        if (!referrals?.length) {
          setLoading(false);
          return;
        }

        const registeredUserIds = referrals
          .map(r => r.registered_user_id)
          .filter((id): id is string => !!id);

        if (!registeredUserIds.length) {
          setLoading(false);
          return;
        }

        // Fetch activity status (now includes usernames) and commission data in parallel
        const [activityResult, commissionsResult] = await Promise.all([
          supabase
            .rpc('get_team_activity_status', { p_team_user_ids: registeredUserIds }),
          supabase
            .from('referral_commissions')
            .select('referred_user_id, commission_points')
            .eq('referrer_user_id', userId)
            .in('referred_user_id', registeredUserIds)
        ]);

        const activityStatus = activityResult.data;
        const commissions = commissionsResult.data;

        // Aggregate commission points per teammate
        const commissionByUser: Record<string, number> = {};
        let totalComm = 0;
        commissions?.forEach((c: any) => {
          const pts = c.commission_points || 0;
          commissionByUser[c.referred_user_id] = (commissionByUser[c.referred_user_id] || 0) + pts;
          totalComm += pts;
        });
        setTotalCommission(totalComm);

        // Build team member list using usernames from RPC (bypasses profiles RLS)
        const members: TeamMember[] = registeredUserIds.map(uid => {
          const status = activityStatus?.find((s: any) => s.team_user_id === uid);

          return {
            user_id: uid,
            username: status?.username || 'User',
            isActive: !!status?.is_active,
            lastActiveAt: status?.last_session_start || null,
            commissionPoints: commissionByUser[uid] || 0,
          };
        });

        // Sort: active first, then by commission points
        members.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return b.commissionPoints - a.commissionPoints;
        });

        setTeamMembers(members.slice(0, 5));
      } catch (error) {
        console.error('[TeamActivityCard] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamActivity();
    const interval = setInterval(fetchTeamActivity, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const activeCount = teamMembers.filter(m => m.isActive).length;

  if (loading) {
    return (
      <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-4 flex items-center justify-center min-h-[120px]">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <button
      onClick={() => { lightTap(); navigate('/app/invite'); }}
      className="w-full rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">My Team</p>
            <p className="text-xs text-muted-foreground">
              {activeCount > 0
                ? `${activeCount} active now`
                : teamMembers.length > 0
                  ? 'No one active'
                  : 'Invite friends'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalCommission > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">+{Math.floor(totalCommission)} pts</span>
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Team Members List */}
      {teamMembers.length > 0 ? (
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div
              key={member.user_id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl border transition-colors",
                member.isActive
                  ? "bg-primary/10 border-primary/20"
                  : "bg-muted/30 border-border"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  member.isActive ? "bg-primary/15" : "bg-muted"
                )}
              >
                {member.isActive ? (
                  <Wifi className="w-4 h-4 text-primary" />
                ) : (
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    member.isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {member.username}
                </p>
                {member.commissionPoints > 0 && (
                  <p className="text-[10px] text-primary/70">
                    +{Math.floor(member.commissionPoints)} pts earned for you
                  </p>
                )}
              </div>

              <div
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                  member.isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {member.isActive ? 'Live' : 'Offline'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-4 text-center">
          <p className="text-sm text-muted-foreground">Invite friends to see their activity here</p>
        </div>
      )}
    </button>
  );
};

export default TeamActivityCard;
