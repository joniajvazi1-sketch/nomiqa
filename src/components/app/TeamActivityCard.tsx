import React, { useEffect, useState } from 'react';
import { Users, Wifi, WifiOff, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';

interface TeamMember {
  user_id: string;
  username: string;
  isActive: boolean;
  lastActiveAt: string | null;
}

interface TeamActivityCardProps {
  userId: string | null;
}

/**
 * Displays the user's invited team members and their live contribution status
 */
export const TeamActivityCard: React.FC<TeamActivityCardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { lightTap } = useHaptics();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchTeamActivity = async () => {
      try {
        // Get the user's affiliate record
        const { data: affiliate } = await supabase
          .from('affiliates_safe')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!affiliate?.id) {
          setLoading(false);
          return;
        }

        // Get referrals that registered (have a user_id)
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

        // Get usernames for these users
        const { data: profiles } = await supabase
          .from('profiles_safe')
          .select('user_id, username')
          .in('user_id', registeredUserIds);

        // Check active contribution sessions (active in last 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: activeSessions } = await supabase
          .from('contribution_sessions')
          .select('user_id, started_at, ended_at, status')
          .in('user_id', registeredUserIds)
          .or(`status.eq.active,ended_at.gte.${tenMinutesAgo}`)
          .order('started_at', { ascending: false });

        // Build team member list
        const members: TeamMember[] = registeredUserIds.map(uid => {
          const profile = profiles?.find(p => p.user_id === uid);
          const session = activeSessions?.find(s => s.user_id === uid);
          const isActive = session?.status === 'active' || 
            (session?.ended_at && new Date(session.ended_at) > new Date(tenMinutesAgo));

          return {
            user_id: uid,
            username: profile?.username || 'User',
            isActive: !!isActive,
            lastActiveAt: session?.started_at || null,
          };
        });

        // Sort: active first, then by last active
        members.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return 0;
        });

        setTeamMembers(members.slice(0, 5)); // Show top 5
      } catch (error) {
        console.error('[TeamActivityCard] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamActivity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTeamActivity, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const activeCount = teamMembers.filter(m => m.isActive).length;

  if (loading) {
    return (
      <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/8 p-4 flex items-center justify-center min-h-[120px]">
        <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <button
      onClick={() => { lightTap(); navigate('/app/invite'); }}
      className="w-full rounded-2xl bg-black/40 backdrop-blur-xl border border-white/8 p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">My Team</p>
            <p className="text-[10px] text-cyan-400">
              {activeCount > 0 
                ? `${activeCount} active now` 
                : teamMembers.length > 0 
                  ? 'No one active' 
                  : 'Invite friends'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40" />
      </div>

      {/* Team Members List */}
      {teamMembers.length > 0 ? (
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div
              key={member.user_id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl transition-colors",
                member.isActive 
                  ? "bg-green-500/10 border border-green-500/20" 
                  : "bg-white/5 border border-white/5"
              )}
            >
              {/* Status Icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                member.isActive 
                  ? "bg-green-500/20" 
                  : "bg-white/10"
              )}>
                {member.isActive ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-white/40" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold truncate",
                  member.isActive ? "text-white" : "text-white/60"
                )}>
                  {member.username}
                </p>
              </div>

              {/* Status Badge */}
              <div className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                member.isActive 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-white/10 text-white/40"
              )}>
                {member.isActive ? 'Live' : 'Offline'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-4 text-center">
          <p className="text-xs text-white/50">
            Invite friends to see their activity here
          </p>
        </div>
      )}
    </button>
  );
};

export default TeamActivityCard;
