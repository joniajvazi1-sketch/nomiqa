import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, QrCode, RefreshCw, ExternalLink } from "lucide-react";
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
}

export default function Orders() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [usageData, setUsageData] = useState<Record<string, UsageData>>({});
  const [refreshingUsage, setRefreshingUsage] = useState<Record<string, boolean>>({});

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

        // Authenticated user access - rely on RLS policies
        const result = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        data = result.data;
        error = result.error;
      }


      // Fetch usage data for each order (skip if using token as it's already fetched)
      if (!accessToken && data && data.length > 0) {
        const usageMap: Record<string, UsageData> = {};
        
        for (const order of data) {
          const { data: usage } = await supabase
            .from('esim_usage')
            .select('remaining_mb, total_mb, status, expired_at')
            .eq('order_id', order.id)
            .single();
          
          if (usage) {
            usageMap[order.id] = usage;
          }
        }
        
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
    } catch (error: any) {
      console.error('Error refreshing usage:', error);
      toast.error("Failed to refresh usage data");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background relative overflow-hidden">
      {/* Faint globe wireframe background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent"></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-violet to-transparent"></div>
        <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-coral to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Orders</h1>
          {new URLSearchParams(window.location.search).get('token') && (
            <p className="text-sm text-muted-foreground mt-2">
              Viewing order via secure access link
            </p>
          )}
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No orders found</p>
              <Button onClick={() => navigate('/')}>
                Browse Packages
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const usage = usageData[order.id];
              const usagePercentage = usage 
                ? ((usage.total_mb - usage.remaining_mb) / usage.total_mb) * 100 
                : 0;
              
              return (
              <Card key={order.id} className={`${order.status === 'completed' || order.status === 'paid' ? 'border-neon-cyan/50 shadow-lg shadow-neon-cyan/20 bg-card/60' : 'bg-card/40'} backdrop-blur-sm transition-all hover:shadow-xl`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{order.package_name}</CardTitle>
                      <CardDescription>
                        {formatDate(order.created_at)} • {order.email}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Package Details</p>
                      <p className="font-medium">{order.data_amount} • {order.validity_days} days</p>
                      <p className="text-sm">Total: ${order.total_amount_usd.toFixed(2)}</p>
                      
                      {usage && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Data Usage</p>
                            {order.iccid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refreshUsage(order.id, order.iccid!)}
                                disabled={refreshingUsage[order.id]}
                              >
                                <RefreshCw className={`h-4 w-4 ${refreshingUsage[order.id] ? 'animate-spin' : ''}`} />
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {(usage.remaining_mb / 1024).toFixed(2)} GB remaining
                              </span>
                              <span className="text-muted-foreground">
                                {(usage.total_mb / 1024).toFixed(2)} GB total
                              </span>
                            </div>
                            <Progress value={usagePercentage} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <Badge 
                                variant={usage.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className={usage.status === 'ACTIVE' ? 'bg-green-600' : ''}
                              >
                                {usage.status === 'NOT_ACTIVE' ? 'Not Activated' : 
                                 usage.status === 'ACTIVE' ? 'Active' : 
                                 usage.status}
                              </Badge>
                            </div>
                            {usage.expired_at && (
                              <div>
                                <p className="text-muted-foreground">Expires</p>
                                <p className="font-medium">{formatDate(usage.expired_at)}</p>
                              </div>
                            )}
                          </div>
                          
                          {usage.status !== 'ACTIVE' && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">
                                💡 After installing and activating your eSIM, click the refresh button above to update the status.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {(order.status === 'completed' || order.status === 'paid') && order.qrcode && (
                      <div className="flex flex-col gap-2 md:justify-end items-stretch md:items-start">
                        {/* Branded eSIM Cloud Portal - Primary action */}
                        {order.sharing_link && (
                          <Button
                            variant="default"
                            size="lg"
                            className="w-full md:w-auto bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 shadow-lg shadow-neon-cyan/20"
                            onClick={() => window.open(order.sharing_link!, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('viewEsimDetails')}
                            {order.sharing_access_code && (
                              <Badge variant="secondary" className="ml-2">
                                {t('accessCode')}: {order.sharing_access_code}
                              </Badge>
                            )}
                          </Button>
                        )}
                        
                        {/* iOS Direct Install - Show on all devices but emphasize for iOS */}
                        {order.lpa && (
                          <Button
                            variant="default"
                            className="w-full md:w-auto"
                            onClick={() => {
                              // On iOS, this will open Settings and prompt to install eSIM
                              window.location.href = order.lpa!;
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Install eSIM (Tap on iOS)
                          </Button>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowQR(true);
                            }}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            View QR Code
                          </Button>
                          {order.qr_code_url && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(order.qr_code_url!, '_blank')}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {order.status === 'pending' && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Your eSIM is being processed. You'll receive an email when it's ready.
                    </p>
                  )}

                  {order.status === 'paid' && !order.qrcode && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Payment confirmed! Your eSIM is being provisioned and will be ready shortly.
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>eSIM QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code with your device to install the eSIM
            </DialogDescription>
          </DialogHeader>
          {selectedOrder?.qrcode && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg flex justify-center">
                <QRCode value={selectedOrder.qrcode} size={256} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Activation Code</p>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {selectedOrder.matching_id}
                </code>
              </div>
              {selectedOrder.iccid && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">ICCID</p>
                  <code className="block p-2 bg-muted rounded text-xs break-all">
                    {selectedOrder.iccid}
                  </code>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}