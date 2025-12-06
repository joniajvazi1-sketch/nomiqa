import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TierUpgradeRequest {
  type: 'affiliate' | 'membership';
  email: string;
  oldTier: number | string;
  newTier: number | string;
  oldTierName?: string;
  newTierName?: string;
  totalConversions?: number;
  totalEarnings?: number;
  totalSpent?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal call - this endpoint is called by database triggers via pg_net
    // Validate the apikey header matches our anon key (triggers use anon key)
    const apiKey = req.headers.get('apikey');
    const expectedAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!apiKey || apiKey !== expectedAnonKey) {
      console.warn("Unauthorized access attempt to notify-tier-upgrade");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const payload: TierUpgradeRequest = await req.json();
    console.log("Tier upgrade notification request:", { type: payload.type, email: payload.email?.substring(0, 3) + '***' });

    // Call send-email edge function
    const emailType = payload.type === 'affiliate' ? 'affiliate_tier_upgrade' : 'tier_upgrade';
    
    const emailData: Record<string, any> = {
      oldTier: payload.oldTier,
      newTier: payload.newTier,
    };

    if (payload.type === 'affiliate') {
      emailData.oldTierName = payload.oldTierName;
      emailData.newTierName = payload.newTierName;
      emailData.totalConversions = payload.totalConversions;
      emailData.totalEarnings = payload.totalEarnings;
    } else {
      emailData.totalSpent = payload.totalSpent;
    }

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: emailType,
        to: payload.email,
        data: emailData,
      },
    });

    if (error) {
      console.error("Error sending tier upgrade email:", error);
      throw error;
    }

    console.log("Tier upgrade email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-tier-upgrade function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
