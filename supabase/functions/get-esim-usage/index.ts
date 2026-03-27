import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const usageRequestSchema = z.object({
  iccid: z.string().min(18).max(22)
});

// HMAC-SHA256 signature for eSIM Access API
async function generateSignature(
  timestamp: string,
  requestId: string,
  accessCode: string,
  requestBody: string,
  secretKey: string
): Promise<string> {
  const signData = timestamp + requestId + accessCode + requestBody;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signData));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toLowerCase();
}

function generateUUID(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT and get user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawBody = await req.json();
    const validationResult = usageRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { iccid } = validationResult.data;

    // Verify user owns this eSIM
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: esimUsage, error: esimError } = await supabase
      .from('esim_usage')
      .select('order_id, orders!inner(user_id)')
      .eq('iccid', iccid)
      .single();

    if (esimError || !esimUsage) {
      return new Response(
        JSON.stringify({ error: 'eSIM not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = esimUsage.orders as any;
    if (!order.user_id || order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - not your eSIM' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 1 request per minute per user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentRequests } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'esim_usage_fetch')
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (recentRequests && recentRequests.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Please wait before refreshing usage data' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this usage fetch
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'esim_usage_fetch',
        payload: { user_id: user.id, iccid }
      });

    // eSIM Access API credentials
    const accessCode = Deno.env.get('ESIM_ACCESS_CODE');
    const secretKey = Deno.env.get('ESIM_ACCESS_SECRET_KEY');

    if (!accessCode || !secretKey) {
      console.error('Missing eSIM Access API credentials');
      throw new Error('eSIM provider configuration error');
    }

    // Build request body for eSIM Access query endpoint
    const queryBody = JSON.stringify({
      iccid: iccid,
      pager: { pageNum: 1, pageSize: 10 }
    });

    // Generate HMAC-SHA256 signature
    const timestamp = Date.now().toString();
    const requestId = generateUUID();
    const signature = await generateSignature(timestamp, requestId, accessCode, queryBody, secretKey);

    console.log(`Fetching eSIM Access usage for ICCID: ${iccid}`);

    const usageResponse = await fetch('https://api.esimaccess.com/api/v1/open/esim/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': accessCode,
        'RT-RequestID': requestId,
        'RT-Signature': signature,
        'RT-Timestamp': timestamp,
      },
      body: queryBody,
    });

    if (!usageResponse.ok) {
      const errorText = await usageResponse.text();
      console.error('eSIM Access API error:', usageResponse.status, errorText);
      throw new Error(`Failed to fetch usage data: ${usageResponse.status}`);
    }

    const responseJson = await usageResponse.json();
    console.log('eSIM Access response:', JSON.stringify(responseJson));

    if (!responseJson.success || !responseJson.obj?.esimList?.length) {
      console.error('eSIM Access: No data returned', responseJson);
      throw new Error('eSIM not found in provider system');
    }

    const esim = responseJson.obj.esimList[0];

    // Convert bytes to MB
    const totalBytes = esim.totalVolume || 0;
    const usedBytes = esim.orderUsage || 0;
    const remainingBytes = Math.max(0, totalBytes - usedBytes);
    const totalMb = Math.round(totalBytes / (1024 * 1024));
    const remainingMb = Math.round(remainingBytes / (1024 * 1024));

    // Map eSIM Access status to our status
    const mapStatus = (esimStatus: string, smdpStatus: string): string => {
      if (esimStatus === 'IN_USE') return 'active';
      if (esimStatus === 'USED_UP') return 'expired';
      if (esimStatus === 'GOT_RESOURCE' && smdpStatus === 'RELEASED') return 'not_active';
      if (esimStatus === 'GOT_RESOURCE' && smdpStatus === 'ENABLED') return 'active';
      if (esimStatus === 'CANCEL') return 'cancelled';
      if (esimStatus === 'SUSPENDED') return 'suspended';
      if (esimStatus === 'UNUSED_EXPIRED' || esimStatus === 'USED_EXPIRED') return 'expired';
      return esimStatus.toLowerCase();
    };

    const status = mapStatus(esim.esimStatus, esim.smdpStatus);

    // Update local database
    await supabase
      .from('esim_usage')
      .update({
        remaining_mb: remainingMb,
        total_mb: totalMb,
        status: status,
        expired_at: esim.expiredTime || null,
        last_updated: new Date().toISOString()
      })
      .eq('iccid', iccid);

    // Return clean usage data
    const usageData = {
      status: status,
      total: totalMb,
      remaining: remainingMb,
      used: totalMb - remainingMb,
      total_bytes: totalBytes,
      used_bytes: usedBytes,
      remaining_bytes: remainingBytes,
      expired_at: esim.expiredTime || null,
      smdp_status: esim.smdpStatus,
      esim_status: esim.esimStatus,
    };

    return new Response(
      JSON.stringify(usageData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching usage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
