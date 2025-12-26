import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RefreshCw, Copy, QrCode, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { useTranslation } from "@/contexts/TranslationContext";

interface UsageData {
  remaining_mb: number;
  total_mb: number;
  status: string;
  expired_at: string | null;
}

interface Order {
  id: string;
  email: string;
  status: string;
  total_amount_usd: number;
  package_name: string;
  data_amount: string;
  validity_days: number;
  created_at: string;
  qrcode: string | null;
  qr_code_url: string | null;
  matching_id: string | null;
  iccid: string | null;
  lpa: string | null;
  manual_installation: string | null;
  qrcode_installation: string | null;
  sharing_link: string | null;
  sharing_access_code: string | null;
  product_id: string | null;
  country_name?: string;
  country_code?: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [usageData, setUsageData] = useState<Record<string, UsageData>>({});
  const [refreshingUsage, setRefreshingUsage] = useState<Record<string, boolean>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Handle payment success redirect from Helio/Phantom
  useEffect(() => {
    const paymentSuccess = searchParams.get('paymentSuccess');
    if (paymentSuccess === 'true') {
      toast.success('Payment successful! Your eSIM is ready.');
      // Clean up the URL parameter
      searchParams.delete('paymentSuccess');
      searchParams.delete('orderId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        for (const key in updated) {
          if (updated[key] > 0) {
            updated[key] = updated[key] - 1;
            hasChanges = true;
          }
        }
        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      // Check for access token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('token');

      let ordersData: Order[] = [];
      let usageMap: Record<string, UsageData> = {};

      if (accessToken) {
        // Guest access using token
        const { data: response, error: funcError } = await supabase.functions.invoke('get-order-by-token', {
          body: { accessToken }
        });

        if (funcError) {
          console.error('Error fetching order by token:', funcError);
          toast.error("Invalid or expired access token");
          setLoading(false);
          return;
        }

        // Transform single order response to array format
        ordersData = response.order ? [response.order] : [];

        // Set usage data if available
        if (response.usage) {
          usageMap[response.order.id] = response.usage;
        }
      } else {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to login if not authenticated
          toast.error("Please login to view your orders");
          navigate('/auth');
          return;
        }

        // Fetch orders via secure backend function (fetches from orders_pii)
        const { data: response, error: fetchError } = await supabase.functions.invoke('get-user-orders', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (fetchError) {
          console.error('Error fetching orders:', fetchError);
          toast.error("Failed to load orders");
          setLoading(false);
          return;
        }

        ordersData = response.orders || [];
        usageMap = response.usage || {};
      }

      setOrders(ordersData);
      setUsageData(usageMap);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for esim_usage updates
    const channel = supabase
      .channel('esim-usage-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'esim_usage'
        },
        (payload) => {
          console.log('eSIM usage updated:', payload);
          // Update local state with new usage data
          const updatedUsage = payload.new as UsageData;
          const orderId = (payload.new as any).order_id;
          if (orderId) {
            setUsageData(prev => ({
              ...prev,
              [orderId]: updatedUsage
            }));
            toast.success("eSIM status updated!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshUsage = async (orderId: string, iccid: string) => {
    // Check if still in cooldown
    if (cooldowns[orderId] && cooldowns[orderId] > 0) {
      toast.error(`Please wait ${cooldowns[orderId]} seconds`);
      return;
    }
    
    setRefreshingUsage(prev => ({ ...prev, [orderId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('get-esim-usage', {
        body: { iccid }
      });

      if (error) throw error;

      // Refresh the order to get updated usage
      const { data: usage } = await supabase
        .from('esim_usage')
        .select('remaining_mb, total_mb, status, expired_at')
        .eq('order_id', orderId)
        .single();

      if (usage) {
        setUsageData(prev => ({ ...prev, [orderId]: usage }));
      }

      toast.success("Usage data refreshed");
      // Start 60 second cooldown after successful refresh
      setCooldowns(prev => ({ ...prev, [orderId]: 60 }));
    } catch (error: any) {
      console.error('Error refreshing usage:', error);
      // Check for rate limit error
      const errorMessage = error?.message || error?.error || 'Failed to refresh usage data';
      if (errorMessage.includes('wait') || errorMessage.includes('rate') || error?.status === 429) {
        toast.error("Please wait 1 minute before refreshing again");
        // Start cooldown even on rate limit error
        setCooldowns(prev => ({ ...prev, [orderId]: 60 }));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setRefreshingUsage(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative overflow-hidden">
      {/* Network Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <Button 
          variant="ghost" 
          className="mb-6 text-foreground/70 hover:text-foreground hover:bg-white/[0.05]" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToHome")}
        </Button>

        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extralight text-foreground mb-2">{t("myEsims")}</h1>
          {new URLSearchParams(window.location.search).get('token') && (
            <p className="text-sm text-foreground/60 mt-2">
              {t("viewingOrderViaLink")}
            </p>
          )}
        </div>

        {orders.length === 0 ? (
          <Card className="bg-white/[0.03] backdrop-blur-xl border border-white/10">
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-foreground/60 mb-6 text-lg font-light">{t("noOrdersFound")}</p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white font-light shadow-lg shadow-neon-cyan/20"
              >
                <span className="break-words">{t("checkoutBrowsePackages")}</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" style={{ contain: 'layout style paint' }}>
            {orders.map((order) => {
              const usage = usageData[order.id];
              const usagePercentage = usage 
                ? (usage.remaining_mb / usage.total_mb) * 100 
                : 0;
              
              return (
              <Card key={order.id} className={`${order.status === 'completed' || order.status === 'paid' ? 'border border-neon-cyan/30 shadow-xl shadow-neon-cyan/10 bg-white/[0.04]' : 'bg-white/[0.03] border border-white/10'} backdrop-blur-xl transition-all hover:shadow-2xl hover:scale-[1.002] duration-300 rounded-2xl will-change-auto`} style={{ contain: 'layout style' }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-light text-foreground">
                        {order.country_name && (
                          <span className="text-neon-cyan">{order.country_name} • </span>
                        )}
                        {order.package_name}
                      </CardTitle>
                      <CardDescription className="text-foreground/60 mt-2">
                        {formatDate(order.created_at)} • {order.email}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={getStatusColor(order.status)}
                      className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 font-light"
                    >
                      {order.status === 'completed' ? t("orderStatusCompleted") :
                       order.status === 'pending' ? t("orderStatusPending") :
                       order.status === 'failed' ? t("orderStatusFailed") :
                       order.status === 'paid' ? t("orderStatusPaid") :
                       order.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/50 font-light">{t("packageDetails")}</p>
                        <p className="text-lg font-light text-foreground">{order.data_amount} • {order.validity_days} {t("productDetailDays")}</p>
                        <p className="text-base text-foreground/70">{t("checkoutTotal")}: <span className="text-neon-cyan font-light">${order.total_amount_usd.toFixed(2)}</span></p>
                      </div>
                      
                      {usage && (
                        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-base font-light text-foreground">{t("dataUsage")}</p>
                            {order.iccid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-white/[0.05] text-foreground/70 hover:text-foreground min-w-[60px]"
                                onClick={() => refreshUsage(order.id, order.iccid!)}
                                disabled={refreshingUsage[order.id] || (cooldowns[order.id] && cooldowns[order.id] > 0)}
                              >
                                {cooldowns[order.id] && cooldowns[order.id] > 0 ? (
                                  <span className="text-xs font-mono">0:{cooldowns[order.id].toString().padStart(2, '0')}</span>
                                ) : (
                                  <RefreshCw className={`h-4 w-4 ${refreshingUsage[order.id] ? 'animate-spin' : ''}`} />
                                )}
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground/60 font-light">
                                {(usage.remaining_mb / 1024).toFixed(2)} GB {t("remaining")}
                              </span>
                              <span className="text-foreground/60 font-light">
                                {(usage.total_mb / 1024).toFixed(2)} GB total
                              </span>
                            </div>
                            <Progress value={usagePercentage} className="h-2 bg-white/10" />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <p className="text-foreground/50 font-light">{t("statusLabel")}</p>
                              <Badge 
                                variant={usage.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className={usage.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border-green-500/30 font-light' : 'bg-white/10 text-foreground/70 border-white/20 font-light'}
                              >
                                {usage.status === 'NOT_ACTIVE' ? t("notActivated") : 
                                 usage.status === 'ACTIVE' ? t("active") : 
                                 usage.status}
                              </Badge>
                            </div>
                            {usage.expired_at && (
                              <div className="space-y-1">
                                <p className="text-foreground/50 font-light">{t("expires")}</p>
                                <p className="font-light text-foreground/80">{formatDate(usage.expired_at)}</p>
                              </div>
                            )}
                          </div>
                          
                          {usage.status !== 'ACTIVE' && (
                            <div className="mt-4 p-4 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/10">
                              <p className="text-sm text-foreground/60 font-light">
                                💡 {t("refreshUsageHint")}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {(order.status === 'completed' || order.status === 'paid') && order.qrcode && (
                      <div className="flex flex-col gap-3 md:justify-end items-stretch md:items-start">
                        {/* Branded eSIM Cloud Portal - Primary action */}
                        {order.sharing_link && (
                          <Button
                            variant="default"
                            size="lg"
                            className="w-full md:w-auto bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 shadow-lg shadow-neon-cyan/20 font-light"
                            onClick={() => window.open(order.sharing_link!, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('viewEsimDetails')}
                            {order.sharing_access_code && (
                              <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30 font-light">
                                {t('accessCode')}: {order.sharing_access_code}
                              </Badge>
                            )}
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          className="bg-white/[0.03] backdrop-blur-xl border-white/20 hover:bg-white/[0.05] hover:border-neon-cyan/40 text-foreground font-light"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowQR(true);
                          }}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          {t("viewQrCode")}
                        </Button>
                      </div>
                    )}
                  </div>

                  {order.status === 'pending' && (
                    <p className="text-sm text-muted-foreground mt-4">
                      {t("esimProcessing")}
                    </p>
                  )}

                  {order.status === 'paid' && !order.qrcode && (
                    <p className="text-sm text-muted-foreground mt-4">
                      {t("paymentConfirmedProvisioning")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )})}
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-foreground">{t("esimQrCodeTitle")}</DialogTitle>
            <DialogDescription className="text-foreground/60 font-light">
              {t("scanQrCodeDesc")}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder?.qrcode && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl flex justify-center shadow-lg">
                <QRCode value={selectedOrder.qrcode} size={256} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-light text-foreground/70">{t("activationCode")}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl text-xs break-all text-foreground font-light">
                    {selectedOrder.matching_id}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-white/[0.03] border-white/20 hover:bg-white/[0.05] hover:border-neon-cyan/40"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.matching_id || '');
                      toast.success(t("copiedToClipboard"));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {selectedOrder.iccid && (
                <div className="space-y-3">
                  <p className="text-sm font-light text-foreground/70">{t("iccid")}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl text-xs break-all text-foreground font-light">
                      {selectedOrder.iccid}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 bg-white/[0.03] border-white/20 hover:bg-white/[0.05] hover:border-neon-cyan/40"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.iccid || '');
                        toast.success(t("copiedToClipboard"));
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}