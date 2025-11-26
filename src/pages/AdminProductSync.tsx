import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminProductSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setLastSyncResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('airlo-products');
      
      if (error) throw error;
      
      setLastSyncResult({ success: true, data });
      toast.success("Products synced successfully!");
    } catch (error: any) {
      console.error('Sync error:', error);
      setLastSyncResult({ success: false, error: error.message });
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <Card className="bg-white/[0.02] backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              Admin: Product Sync
            </CardTitle>
            <CardDescription className="text-white/60">
              Sync products from Airalo API to update product catalog with operator images and country images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleSync}
              disabled={syncing}
              size="lg"
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white border-0 shadow-glow-cyan font-light h-14 rounded-xl"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Syncing Products...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Sync Products Now
                </>
              )}
            </Button>

            {lastSyncResult && (
              <div className={`p-4 rounded-xl border ${
                lastSyncResult.success 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {lastSyncResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <span className={lastSyncResult.success ? 'text-green-400' : 'text-red-400'}>
                    {lastSyncResult.success ? 'Sync Successful' : 'Sync Failed'}
                  </span>
                </div>
                <pre className="text-xs text-white/60 overflow-auto max-h-64 mt-2">
                  {JSON.stringify(lastSyncResult.success ? lastSyncResult.data : lastSyncResult.error, null, 2)}
                </pre>
              </div>
            )}

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-white font-light mb-2">What does this sync?</h3>
              <ul className="text-sm text-white/60 space-y-1 font-light">
                <li>• Fetches all packages from Airalo API</li>
                <li>• Updates product prices and availability</li>
                <li>• Populates operator names and logos</li>
                <li>• Adds country images for visual display</li>
                <li>• Runs every 55 minutes automatically via cron</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AdminProductSync;
