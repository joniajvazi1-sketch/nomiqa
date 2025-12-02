import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StuckOrder {
  id: string;
  email: string;
  status: string;
  total_amount_usd: number;
  created_at: string;
  product_id: string;
}

export default function AdminRecovery() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [stuckOrders, setStuckOrders] = useState<StuckOrder[]>([]);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const fetchStuckOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, email, status, total_amount_usd, created_at, product_id')
        .in('status', ['pending_payment', 'paid', 'processing'])
        .is('iccid', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setStuckOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to fetch stuck orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchStuckOrders();
  }, []);

  const handleRecover = async (orderIdToRecover: string) => {
    if (!orderIdToRecover.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    setProcessingOrderId(orderIdToRecover);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in as an admin');
        setLoading(false);
        setProcessingOrderId(null);
        return;
      }

      console.log('Calling provision-esim-manual function for:', orderIdToRecover);
      
      const { data, error } = await supabase.functions.invoke('provision-esim-manual', {
        body: { orderId: orderIdToRecover.trim() },
      });

      if (error) {
        console.error('Recovery error:', error);
        toast.error(`Recovery failed: ${error.message}`);
        setResult({ error: error.message });
      } else {
        console.log('Recovery result:', data);
        toast.success(data.message || 'eSIM provisioned successfully!');
        setResult(data);
        // Refresh the orders list
        await fetchStuckOrders();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Unexpected error occurred');
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
      setProcessingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending_payment': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Manual Recovery Card */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              Order Recovery (Admin)
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Manually recover and provision eSIMs for stuck orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="orderId" className="text-sm font-medium text-foreground/90">
                Order ID
              </label>
              <div className="flex gap-2">
                <Input
                  id="orderId"
                  type="text"
                  placeholder="Enter order ID (UUID)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
                <Button
                  onClick={() => handleRecover(orderId)}
                  disabled={loading || !orderId.trim()}
                  size="lg"
                >
                  {loading && processingOrderId === orderId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Recover'
                  )}
                </Button>
              </div>
            </div>

            {result && (
              <Card className={`${result.error ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {result.error ? (
                      <><AlertCircle className="w-5 h-5 text-red-400" /> Error</>
                    ) : (
                      <><CheckCircle2 className="w-5 h-5 text-green-400" /> Success</>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-foreground/80 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Stuck Orders List */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-white">
                  Stuck Orders ({stuckOrders.length})
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Orders without eSIM provisioning
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchStuckOrders}
                disabled={loadingOrders}
                className="border-white/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingOrders ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-foreground/50" />
              </div>
            ) : stuckOrders.length === 0 ? (
              <p className="text-center text-foreground/50 py-8">No stuck orders found</p>
            ) : (
              <div className="space-y-3">
                {stuckOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <span className="text-sm text-foreground/50">
                          ${order.total_amount_usd.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/70 truncate">{order.email}</p>
                      <p className="text-xs text-foreground/40 font-mono truncate">{order.id}</p>
                      <p className="text-xs text-foreground/40">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleRecover(order.id)}
                      disabled={loading}
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                    >
                      {loading && processingOrderId === order.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Provision eSIM'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-foreground/70 space-y-2 list-disc list-inside">
              <li>Click "Provision eSIM" on any stuck order to manually trigger provisioning</li>
              <li>The system will call Airalo API to create the eSIM</li>
              <li>eSIM details will be saved and customer will receive email from Airalo</li>
              <li>Order status will change to "completed" once successful</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}