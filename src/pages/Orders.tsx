import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Copy, QrCode, ExternalLink, Wifi, Signal } from "lucide-react";
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

  useEffect(() => {
    const paymentSuccess = searchParams.get('paymentSuccess');
    if (paymentSuccess === 'true') {
      toast.success('Payment successful! Your eSIM is ready.');
      searchParams.delete('paymentSuccess');
      searchParams.delete('orderId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('token');
      let data, error;

      if (accessToken) {
        const { data: response, error: funcError } = await supabase.functions.invoke('get-order-by-token', {
          body: { accessToken }
        });
        if (funcError) {
          console.error('Error fetching order by token:', funcError);
          toast.error("Invalid or expired access token");
          setLoading(false);
          return;
        }
        data = response.order ? [response.order] : [];
        error = null;
        if (response.usage) {
          setUsageData({ [response.order.id]: response.usage });
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please login to view your orders");
          navigate('/auth');
          return;
        }
        const { data: response, error: funcError } = await supabase.functions.invoke('get-my-orders');
        if (funcError) {
          console.error('Error fetching orders:', funcError);
          throw funcError;
        }
        data = response?.orders || [];
        error = null;
      }

      if (!accessToken && data && data.length > 0) {
        const usageMap: Record<string, UsageData> = {};
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
          if (usage) usageMap[orderId] = usage;
        });
        setUsageData(usageMap);
      }

      if (error) throw error;
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
    const channel = supabase
      .channel('esim-usage-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'esim_usage' }, (payload) => {
        const updatedUsage = payload.new as UsageData;
        const orderId = (payload.new as any).order_id;
        if (orderId) {
          setUsageData(prev => ({ ...prev, [orderId]: updatedUsage }));
          toast.success("eSIM status updated!");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const refreshUsage = async (orderId: string, iccid: string) => {
    if (cooldowns[orderId] && cooldowns[orderId] > 0) {
      toast.error(`Please wait ${cooldowns[orderId]} seconds`);
      return;
    }
    setRefreshingUsage(prev => ({ ...prev, [orderId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('get-esim-usage', { body: { iccid } });
      if (error) throw error;
      const { data: usage } = await supabase
        .from('esim_usage')
        .select('remaining_mb, total_mb, status, expired_at')
        .eq('order_id', orderId)
        .single();
      if (usage) setUsageData(prev => ({ ...prev, [orderId]: usage }));
      toast.success("Usage data refreshed");
      setCooldowns(prev => ({ ...prev, [orderId]: 60 }));
    } catch (error: any) {
      console.error('Error refreshing usage:', error);
      const errorMessage = error?.message || error?.error || 'Failed to refresh usage data';
      if (errorMessage.includes('wait') || errorMessage.includes('rate') || error?.status === 429) {
        toast.error("Please wait 1 minute before refreshing again");
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
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatPackageName = (name: string) => {
    return name.replace(/([a-zA-Z])(\d)/g, '$1 $2').replace(/(\d)([a-zA-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim();
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
          <div className="space-y-5">
            {orders.map((order) => {
              const usage = usageData[order.id];
              const usagePercentage = usage && usage.total_mb > 0 ? (usage.remaining_mb / usage.total_mb) * 100 : 0;
              const usedGb = usage ? ((usage.total_mb - usage.remaining_mb) / 1024).toFixed(2) : '0';
              const totalGb = usage ? (usage.total_mb / 1024).toFixed(1) : '0';
              const remainingGb = usage ? (usage.remaining_mb / 1024).toFixed(2) : '0';
              const packageDetailsParts = [
                order.data_amount || null,
                order.validity_days ? `${order.validity_days} ${t("productDetailDays")}` : null,
              ].filter(Boolean) as string[];
              const packageDetailsText = packageDetailsParts.join(' · ');
              const isActive = usage?.status?.toLowerCase() === 'active';
              const isExpired = usage?.status?.toLowerCase() === 'expired';
              const isNotActive = usage?.status?.toLowerCase() === 'not_active';

              return (
                <div key={order.id} className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
                  
                  {/* Top section: Country + Status */}
                  <div className="px-5 pt-5 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white/[0.05] border border-white/[0.08]">
                          {order.country_code ? (
                            <img 
                              src={`https://flagcdn.com/w80/${order.country_code.toLowerCase()}.png`} 
                              alt={order.country_name || ''} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Signal className="h-4.5 w-4.5 text-foreground/30" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-medium text-foreground truncate">
                            {order.country_name || formatPackageName(order.package_name || 'eSIM')}
                          </h3>
                          <p className="text-xs text-foreground/35 font-light mt-0.5">
                            {packageDetailsText || formatPackageName(order.package_name || '')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 
                          isExpired ? 'bg-red-400' : 
                          isNotActive ? 'bg-foreground/20' :
                          'bg-amber-400'
                        }`} />
                        <span className={`text-xs font-light ${
                          isActive ? 'text-emerald-400' : 
                          isExpired ? 'text-red-400/70' : 
                          'text-foreground/40'
                        }`}>
                          {isNotActive ? t("notActivated") :
                           isActive ? t("active") :
                           isExpired ? t("expired") :
                           usage?.status || (order.status === 'completed' ? t("orderStatusCompleted") : order.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Data usage bar */}
                  {usage && (
                    <div className="px-5 py-4">
                      {/* Usage numbers */}
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <span className="text-2xl font-light text-foreground tabular-nums">{remainingGb}</span>
                          <span className="text-sm text-foreground/30 font-light ml-1">GB left</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-foreground/30 font-light">{totalGb} GB</span>
                        </div>
                      </div>

                      {/* Progress bar - thick and visible */}
                      <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            usagePercentage > 50 ? 'bg-emerald-400' :
                            usagePercentage > 20 ? 'bg-amber-400' :
                            'bg-red-400'
                          }`}
                          style={{ width: `${Math.max(2, usagePercentage)}%` }}
                        />
                      </div>

                      {/* Expiry + Refresh */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-foreground/30 font-light">
                          {usage.expired_at ? (
                            <span>{t("expires")}: {formatDate(usage.expired_at)}</span>
                          ) : (
                            <span>{formatDate(order.created_at)}</span>
                          )}
                        </div>
                        {order.iccid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 hover:bg-white/[0.05] text-foreground/30 hover:text-foreground/60 gap-1.5"
                            onClick={() => refreshUsage(order.id, order.iccid!)}
                            disabled={refreshingUsage[order.id] || (cooldowns[order.id] && cooldowns[order.id] > 0)}
                          >
                            {cooldowns[order.id] && cooldowns[order.id] > 0 ? (
                              <span className="text-[10px] font-mono text-foreground/25">0:{cooldowns[order.id].toString().padStart(2, '0')}</span>
                            ) : (
                              <>
                                <RefreshCw className={`h-3 w-3 ${refreshingUsage[order.id] ? 'animate-spin' : ''}`} />
                                <span className="text-[11px]">Refresh</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {(order.status === 'completed' || order.status === 'paid') && order.qrcode && (
                    <div className="border-t border-white/[0.05] px-5 py-3.5 flex flex-col gap-2.5">
                      {order.sharing_link && (
                        <Button
                          size="sm"
                          className="w-full bg-foreground text-background hover:bg-foreground/90 font-light rounded-xl h-11 text-sm"
                          onClick={() => window.open(order.sharing_link!, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('viewEsimDetails')}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent border-white/[0.1] hover:bg-white/[0.04] hover:border-white/[0.15] text-foreground/60 font-light rounded-xl h-11 text-sm"
                        onClick={() => { setSelectedOrder(order); setShowQR(true); }}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
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
