import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminRecovery() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRecover = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in as an admin');
        setLoading(false);
        return;
      }

      console.log('Calling recover-order function for:', orderId);
      
      const { data, error } = await supabase.functions.invoke('recover-order', {
        body: { orderId: orderId.trim() },
      });

      if (error) {
        console.error('Recovery error:', error);
        toast.error(`Recovery failed: ${error.message}`);
        setResult({ error: error.message });
      } else {
        console.log('Recovery result:', data);
        toast.success(data.message || 'Order recovery initiated successfully');
        setResult(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Unexpected error occurred');
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-2xl mx-auto">
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
              <Input
                id="orderId"
                type="text"
                placeholder="Enter order ID (UUID)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <Button
              onClick={handleRecover}
              disabled={loading || !orderId.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Recover Order'
              )}
            </Button>

            {result && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {result.error ? 'Error' : 'Success'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-foreground/80 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-foreground/90 mb-2">How it works:</h3>
              <ul className="text-sm text-foreground/70 space-y-1 list-disc list-inside">
                <li>Enter the stuck order ID</li>
                <li>Function checks if eSIM already provisioned</li>
                <li>If not, triggers Airalo API to provision the eSIM</li>
                <li>Waits for Airalo webhook callback with eSIM details</li>
                <li>Sends confirmation email to customer</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-foreground/90 mb-2">Stuck Order ID:</h3>
              <code className="text-sm text-neon-cyan bg-black/20 px-2 py-1 rounded">
                a021baa2-5b34-43a7-909d-17db2025fdf8
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
