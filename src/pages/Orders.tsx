import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";

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
  manual_installation: string | null;
  qrcode_installation: string | null;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (user) {
        query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
      }

      const { data, error } = await query;

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
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

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
            {orders.map((order) => (
              <Card key={order.id}>
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
                    </div>

                    {order.status === 'completed' && order.qrcode && (
                      <div className="flex gap-2 md:justify-end items-start">
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
                    )}
                  </div>

                  {order.status === 'pending' && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Your eSIM is being processed. You'll receive an email when it's ready.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
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