import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  // Handle payment success redirect
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

      let data, error;

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
        data = response.order ? [response.order] : [];
        error = null;

        // Set usage data if available
        if (response.usage) {
          setUsageData({ [response.order.id]: response.usage });
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

        // Authenticated user access - Use edge function to get orders with PII
        const { data: response, error: funcError } = await supabase.functions.invoke('get-my-orders');

        if (funcError) {
          console.error('Error fetching orders:', funcError);
          throw funcError;
        }

        data = response?.orders || [];
        error = null;
      }


      // Fetch usage data for each order in parallel (skip if using token as it's already fetched)
      if (!accessToken && data && data.length > 0) {
        const usageMap: Record<string, UsageData> = {};
        
        // Fetch all usage data in parallel for better performance
        const usagePromises = data.map(order => 
          supabase
            .from('esim_usage')
            .select('remaining_mb, total_mb, status, expired_at')
            .eq('order_id', order.id)
            .single()
            .then(({ data: usage }) => ({ orderId: order.id, usage }))
        );
        
        const usageResults = await Promise.all(usagePromises);
        
        usageResults.forEach(({ orderId, usage }) => {
          if (usage) {
            usageMap[orderId] = usage;
          }
        });
        
        setUsageData(usageMap);
      }

      if (error) {
        throw error;
      }

      setOrders(data || []);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPackageName = (name: string) => {
    return name
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-foreground/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6 text-foreground/50 hover:text-foreground hover:bg-white/[0.05]"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToHome")}
        </Button>

        <div className="mb-10">
          <h1 className="text-3xl font-extralight text-foreground tracking-tight">{t("myEsims")}</h1>
          {new URLSearchParams(window.location.search).get('token') && (
            <p className="text-sm text-foreground/40 mt-1 font-light">{t("viewingOrderViaLink")}</p>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 text-center">
            <p className="text-foreground/50 mb-6 text-base font-light">{t("noOrdersFound")}</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-foreground text-background hover:bg-foreground/90 font-light rounded-xl"
            >
              {t("checkoutBrowsePackages")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const usage = usageData[order.id];
              const usagePercentage = usage && usage.total_mb > 0
                ? (usage.remaining_mb / usage.total_mb) * 100
                : 0;
              const packageDetailsParts = [
                order.data_amount || null,
                order.validity_days ? `${order.validity_days} ${t("productDetailDays")}` : null,
              ].filter(Boolean) as string[];
              const packageDetailsText = packageDetailsParts.join(' · ');
              const isActive = usage?.status?.toLowerCase() === 'active';
              const isExpired = usage?.status?.toLowerCase() === 'expired';

              return (
                <div key={order.id} className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden transition-all hover:border-white/[0.14] duration-300">
                  {/* Header */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-light text-foreground">
                          {order.country_name || formatPackageName(order.package_name || 'eSIM Package')}
                        </h3>
                        {order.country_name && (
                          <p className="text-sm text-foreground/35 font-light mt-0.5">
                            {formatPackageName(order.package_name || '')}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`shrink-0 font-light text-[11px] px-2.5 py-0.5 rounded-full border ${
                          order.status === 'completed' || order.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400/90 border-emerald-500/15'
                            : order.status === 'failed'
                            ? 'bg-red-500/10 text-red-400/90 border-red-500/15'
                            : 'bg-white/[0.05] text-foreground/40 border-white/[0.06]'
                        }`}
                      >
                        {order.status === 'completed' ? t("orderStatusCompleted") :
                         order.status === 'pending' ? t("orderStatusPending") :
                         order.status === 'failed' ? t("orderStatusFailed") :
                         order.status === 'paid' ? t("orderStatusPaid") :
                         order.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-1.5 text-xs text-foreground/30 font-light flex-wrap">
                      {packageDetailsText && <><span>{packageDetailsText}</span><span>·</span></>}
                      <span>${order.total_amount_usd.toFixed(2)}</span>
                      <span>·</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Usage */}
                  {usage && (
                    <div className="border-t border-white/[0.05] px-5 py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : isExpired ? 'bg-red-400/70' : 'bg-foreground/20'}`} />
                          <span className={`text-xs font-light ${isActive ? 'text-emerald-400/90' : isExpired ? 'text-red-400/70' : 'text-foreground/40'}`}>
                            {usage.status?.toLowerCase() === 'not_active' ? t("notActivated") :
                             isActive ? t("active") :
                             isExpired ? t("expired") :
                             usage.status || '—'}
                          </span>
                        </div>
                        {order.iccid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-white/[0.04] text-foreground/30 hover:text-foreground/60"
                            onClick={() => refreshUsage(order.id, order.iccid!)}
                            disabled={refreshingUsage[order.id] || (cooldowns[order.id] && cooldowns[order.id] > 0)}
                          >
                            {cooldowns[order.id] && cooldowns[order.id] > 0 ? (
                              <span className="text-[10px] font-mono text-foreground/25">0:{cooldowns[order.id].toString().padStart(2, '0')}</span>
                            ) : (
                              <RefreshCw className={`h-3.5 w-3.5 ${refreshingUsage[order.id] ? 'animate-spin' : ''}`} />
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              usagePercentage > 50 ? 'bg-emerald-400/70' :
                              usagePercentage > 20 ? 'bg-amber-400/70' :
                              'bg-red-400/70'
                            }`}
                            style={{ width: `${Math.max(1, usagePercentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-foreground/30 font-light">
                          <span>{(usage.remaining_mb / 1024).toFixed(1)} GB left</span>
                          <span>{(usage.total_mb / 1024).toFixed(1)} GB</span>
                        </div>
                      </div>

                      {usage.expired_at && (
                        <p className="text-[11px] text-foreground/25 font-light">
                          {t("expires")}: {formatDate(usage.expired_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {(order.status === 'completed' || order.status === 'paid') && order.qrcode && (
                    <div className="border-t border-white/[0.05] px-5 py-3 flex gap-2">
                      {order.sharing_link && (
                        <Button
                          size="sm"
                          className="flex-1 bg-foreground/90 text-background hover:bg-foreground font-light rounded-xl h-9 text-xs"
                          onClick={() => window.open(order.sharing_link!, '_blank')}
                        >
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          {t('viewEsimDetails')}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12] text-foreground/60 font-light rounded-xl h-9 text-xs"
                        onClick={() => { setSelectedOrder(order); setShowQR(true); }}
                      >
                        <QrCode className="mr-1.5 h-3.5 w-3.5" />
                        {t("viewQrCode")}
                      </Button>
                    </div>
                  )}

                  {order.status === 'pending' && (
                    <div className="border-t border-white/[0.05] px-5 py-3">
                      <p className="text-xs text-foreground/30 font-light">{t("esimProcessing")}</p>
                    </div>
                  )}
                  {order.status === 'paid' && !order.qrcode && (
                    <div className="border-t border-white/[0.05] px-5 py-3">
                      <p className="text-xs text-foreground/30 font-light">{t("paymentConfirmedProvisioning")}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm bg-background/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-light text-foreground">{t("esimQrCodeTitle")}</DialogTitle>
            <DialogDescription className="text-foreground/40 font-light text-sm">{t("scanQrCodeDesc")}</DialogDescription>
          </DialogHeader>
          {selectedOrder?.qrcode && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl flex justify-center">
                <QRCode value={selectedOrder.qrcode} size={220} />
              </div>
              {selectedOrder.matching_id && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-light text-foreground/40">{t("activationCode")}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] break-all text-foreground/60 font-light">
                      {selectedOrder.matching_id}
                    </code>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 hover:bg-white/[0.04]"
                      onClick={() => { navigator.clipboard.writeText(selectedOrder.matching_id || ''); toast.success(t("copiedToClipboard")); }}>
                      <Copy className="h-3.5 w-3.5 text-foreground/40" />
                    </Button>
                  </div>
                </div>
              )}
              {selectedOrder.iccid && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-light text-foreground/40">{t("iccid")}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] break-all text-foreground/60 font-light">
                      {selectedOrder.iccid}
                    </code>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 hover:bg-white/[0.04]"
                      onClick={() => { navigator.clipboard.writeText(selectedOrder.iccid || ''); toast.success(t("copiedToClipboard")); }}>
                      <Copy className="h-3.5 w-3.5 text-foreground/40" />
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
