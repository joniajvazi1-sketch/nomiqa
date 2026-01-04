import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Wallet, Search, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserData {
  id: string;
  user_id: string;
  username: string;
  email: string | null;
  email_verified: boolean;
  solana_wallet: string | null;
  is_early_member: boolean;
  created_at: string;
  is_affiliate: boolean;
  affiliate_code: string | null;
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
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
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
      }
    };

    fetchData();
  }, [navigate]);

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.affiliate_code?.toLowerCase().includes(search) ||
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">User & Referral Dashboard</h1>
            <p className="text-muted-foreground">Track all users, referrals, and affiliate performance</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Users</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.total_users}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Verified</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.verified_emails}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Wallets</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.wallets_connected}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email, or affiliate code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email Verified</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Referred By</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No users match your search" : "No users found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email_verified ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.solana_wallet ? (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {truncateWallet(user.solana_wallet)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.referred_by ? (
                            <div>
                              <p className="text-sm">{user.referred_by.username || user.referred_by.email}</p>
                              <p className="text-xs text-muted-foreground font-mono">{user.referred_by.affiliate_code}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Direct</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.is_affiliate ? (
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                              {user.affiliate_code}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.total_registrations}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.total_conversions}</span>
                        </TableCell>
                        <TableCell>
                          {user.total_earnings_usd > 0 ? (
                            <span className="font-medium text-green-600">${user.total_earnings_usd.toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">$0.00</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
