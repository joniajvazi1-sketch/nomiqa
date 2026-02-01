import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Wallet, Search, CheckCircle, XCircle, ArrowLeft, ChevronRight, RefreshCw, Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserData {
  id: string;
  user_id: string;
  username: string;
  email: string | null;
  email_verified: boolean;
  solana_wallet: string | null;
  is_early_member: boolean;
  created_at: string;
  country_code: string | null;
  is_affiliate: boolean;
  affiliate_count: number;
  affiliate_usernames: string;
  total_registrations: number;
  total_conversions: number;
  total_earnings_usd: number;
  tier_level: number;
  miner_boost_percentage: number;
  referred_by: {
    email: string;
    username: string | null;
    affiliate_code: string;
  } | null;
  referral_status: string | null;
}


interface Stats {
  total_users: number;
  verified_emails: number;
  wallets_connected: number;
  total_affiliates: number;
  total_referrals: number;
  total_conversions: number;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/auth?redirect=${redirect}`);
        return;
      }

      const response = await supabase.functions.invoke("get-admin-users");
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        if (response.data.error.includes("Forbidden")) {
          setError("You don't have admin access to view this page.");
        } else {
          throw new Error(response.data.error);
        }
        return;
      }

      setUsers(response.data.users || []);
      setStats(response.data.stats || null);
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.affiliate_usernames?.toLowerCase().includes(search) ||
      user.referred_by?.username?.toLowerCase().includes(search) ||
      user.referred_by?.email?.toLowerCase().includes(search)
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateWallet = (wallet: string | null) => {
    if (!wallet) return null;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile user detail view
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-white/10 p-4">
          <Button 
            onClick={() => setSelectedUser(null)} 
            variant="ghost" 
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* User Header */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {selectedUser.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold truncate">{selectedUser.username}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{selectedUser.email || "No email"}</p>
                </div>
                {selectedUser.email_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Joined {formatDate(selectedUser.created_at)}</p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Wallet</p>
                {selectedUser.solana_wallet ? (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {truncateWallet(selectedUser.solana_wallet)}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Not connected</p>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Referred By</p>
                {selectedUser.referred_by ? (
                  <div>
                    <p className="text-sm font-medium truncate">{selectedUser.referred_by.username || "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{selectedUser.referred_by.affiliate_code}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Direct signup</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Affiliate Stats - only show if they have referrals or earnings */}
          {selectedUser.is_affiliate && (selectedUser.total_registrations > 0 || selectedUser.total_conversions > 0 || selectedUser.total_earnings_usd > 0) && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">
                  Affiliate Stats {selectedUser.affiliate_count > 1 && `(${selectedUser.affiliate_count} links)`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold">{selectedUser.total_registrations}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedUser.total_conversions}</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">${selectedUser.total_earnings_usd.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-16">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-xl border-b border-white/10 p-3 md:p-4">
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
          <div className="min-w-0">
            <h1 className="text-base md:text-2xl font-bold truncate">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={() => fetchData(true)} 
              variant="ghost" 
              size="sm" 
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" size="sm" className="h-8">
              <ArrowLeft className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground truncate">Users</span>
                </div>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats.total_users}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-green-500 shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground truncate">Verified</span>
                </div>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats.verified_emails}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Wallet className="w-4 h-4 md:w-5 md:h-5 text-purple-500 shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground truncate">Wallets</span>
                </div>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats.wallets_connected}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Referrers Leaderboard */}
        {stats && (
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Top 25 Referrers Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {(() => {
                const topReferrers = [...users]
                  .filter(u => u.total_registrations > 0)
                  .sort((a, b) => b.total_registrations - a.total_registrations)
                  .slice(0, 25);
                
                if (topReferrers.length === 0) {
                  return <p className="text-sm text-muted-foreground">No referrals yet</p>;
                }
                
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Rank</th>
                          <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Username</th>
                          <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium hidden md:table-cell">Email</th>
                          <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Referrals</th>
                          <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Boost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topReferrers.map((user, index) => (
                          <tr 
                            key={user.id} 
                            className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                            onClick={() => setSelectedUser(user)}
                          >
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center w-6">
                                {index === 0 ? (
                                  <Medal className="w-5 h-5 text-amber-400" />
                                ) : index === 1 ? (
                                  <Medal className="w-5 h-5 text-gray-400" />
                                ) : index === 2 ? (
                                  <Medal className="w-5 h-5 text-orange-600" />
                                ) : (
                                  <span className="text-muted-foreground font-medium">{index + 1}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 font-medium">{user.username}</td>
                            <td className="py-2 px-2 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{user.email}</td>
                            <td className="py-2 px-2 text-right font-bold text-primary">{user.total_registrations}</td>
                            <td className="py-2 px-2 text-right">
                              {user.miner_boost_percentage > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  +{user.miner_boost_percentage}%
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>

        {/* Mobile User List */}
        <div className="md:hidden space-y-2">
          {filteredUsers.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchTerm ? "No users match your search" : "No users found"}
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card 
                key={user.id} 
                className="bg-white/5 border-white/10 active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.username}</p>
                        {user.email_verified ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {user.is_affiliate && user.total_registrations > 0 && (
                          <span className="text-primary font-medium">{user.total_registrations} refs</span>
                        )}
                        {user.solana_wallet && (
                          <Wallet className="w-3 h-3 text-purple-500" />
                        )}
                        {user.referred_by && (
                          <span className="truncate">via {user.referred_by.username || 'referral'}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Verified</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Referred By</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Refs</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Conv</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Earned</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No users match your search" : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {user.email_verified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {user.referred_by ? (
                            <span className="text-sm">{user.referred_by.username || 'referral'}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-medium">
                          {user.total_registrations > 0 ? user.total_registrations : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-2 font-medium">
                          {user.total_conversions > 0 ? user.total_conversions : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-2">
                          {user.total_earnings_usd > 0 ? (
                            <span className="font-medium text-green-500">${user.total_earnings_usd.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {formatDate(user.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
