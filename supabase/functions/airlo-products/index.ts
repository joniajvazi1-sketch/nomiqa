import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AirloAuthResponse {
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  meta?: {
    message?: string;
  };
}

interface AirloPackage {
  id: string;
  title: string;
  data: {
    amount: number;
    unit: string;
  };
  validity: {
    amount: number;
    unit: string;
  };
  price: {
    amount: number;
    currency: string;
  };
  country: {
    iso_code: string;
    name: string;
  };
  is_stock_available: boolean;
}

async function getAirloAccessToken(baseUrl: string): Promise<{ accessToken: string; tokenType: string }> {
  const clientId = Deno.env.get('AIRLO_CLIENT_ID');
  const clientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');

  console.log(`Requesting Airlo access token from ${baseUrl}...`);

  const form = new FormData();
  form.append('client_id', clientId || '');
  form.append('client_secret', clientSecret || '');
  form.append('grant_type', 'client_credentials');

  const response = await fetch(`${baseUrl}/v2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Airlo auth error:', error);
    throw new Error(`Failed to authenticate with Airlo: ${response.status}`);
  }

  const json: AirloAuthResponse = await response.json();
  const accessToken = json?.data?.access_token;
  const tokenType = json?.data?.token_type || 'Bearer';

  if (!accessToken) {
    console.error('Airlo auth missing access_token:', JSON.stringify(json));
    throw new Error('Airlo auth succeeded but no access_token returned');
  }

  console.log('Successfully obtained Airlo access token');
  return { accessToken, tokenType };
}

async function fetchAirloPackages(baseUrl: string, accessToken: string, tokenType: string): Promise<AirloPackage[]> {
  console.log('Fetching packages from Airlo...');
  console.log(`Using Authorization: ${tokenType} ${accessToken.substring(0, 20)}...`);

  const response = await fetch(`${baseUrl}/v2/packages?limit=50`, {
    headers: {
      'Authorization': `${tokenType} ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  console.log(`Packages response status: ${response.status}`);

  if (!response.ok) {
    const error = await response.text();
    console.error(`Airlo packages error (${response.status}):`, error);
    throw new Error(`Failed to fetch packages: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`Fetched ${data.data?.length || 0} packages from Airlo`);
  return data.data || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Preparing Airlo products sync...');

const preferredEnv = (Deno.env.get('AIRLO_ENV')?.toLowerCase() === 'sandbox') ? 'sandbox' : 'prod';
const envs = [preferredEnv, preferredEnv === 'prod' ? 'sandbox' : 'prod'];

let packages: AirloPackage[] = [];
let lastError: any = null;

for (const env of envs) {
  const baseUrl = env === 'sandbox' 
    ? 'https://sandbox-partners-api.airalo.com' 
    : 'https://partners-api.airalo.com';

  console.log(`Starting Airlo products sync from ${baseUrl} (${env})...`);

  try {
    // token + packages (attempt 1)
    const { accessToken, tokenType } = await getAirloAccessToken(baseUrl);
    try {
      packages = await fetchAirloPackages(baseUrl, accessToken, tokenType);
      console.log(`Fetched ${packages.length} packages from ${env}`);
      break; // success
    } catch (pkgErr) {
      const msg = pkgErr instanceof Error ? pkgErr.message : String(pkgErr);
      console.warn(`First package fetch failed on ${env}: ${msg}. Retrying with a fresh token...`);
      // retry once with a fresh token (helps if token was rejected)
      const { accessToken: atk2, tokenType: tt2 } = await getAirloAccessToken(baseUrl);
      packages = await fetchAirloPackages(baseUrl, atk2, tt2);
      console.log(`Fetched ${packages.length} packages from ${env} on retry`);
      break; // success on retry
    }
  } catch (e) {
    lastError = e;
    console.error(`Sync attempt with ${env} failed:`, e);
  }
}

if (packages.length === 0) {
  throw lastError || new Error('Failed to fetch packages from all environments');
}

    // Quick debug: log sample structure
    if (packages.length > 0) {
      const sample = packages[0];
      console.log('Sample country keys:', sample?.country ? Object.keys(sample.country) : 'no country');
      console.log('Sample data keys:', sample?.data ? Object.keys(sample.data) : 'no data');
    }

    // Normalize packages and defensively map fields
    const normalized = packages.map((raw: any) => {
      const id = raw?.id ?? raw?.package_id ?? raw?.packageId ?? raw?.uuid ?? raw?.code;
      const countryObj = raw?.country ?? {};
      const country_code =
        countryObj?.iso_code ?? countryObj?.isoCode ?? countryObj?.code ?? raw?.country_code ?? raw?.country_iso ?? raw?.countryIso;
      const country_name =
        countryObj?.name ?? countryObj?.title ?? raw?.country_name ?? raw?.countryName;
      const data_amount_val = raw?.data?.amount ?? raw?.data_amount ?? raw?.dataAmount ?? raw?.package_data_amount;
      const data_unit = raw?.data?.unit ?? raw?.data_unit ?? raw?.dataUnit ?? 'GB';
      const validity_days = raw?.validity?.amount ?? raw?.validity_days ?? raw?.validityDays;
      const price_usd = raw?.price?.amount ?? raw?.price_usd ?? raw?.priceUsd ?? raw?.amount;

      const is_stock_available = raw?.is_stock_available ?? (typeof raw?.stock === 'number' ? raw.stock > 0 : true);

      return {
        ok: !!id && !!country_code && !!country_name && data_amount_val != null && validity_days != null && price_usd != null && is_stock_available !== false,
        id,
        name: raw?.title ?? raw?.name ?? `${country_name} ${data_amount_val}${data_unit}`,
        country_code,
        country_name,
        data_amount: `${data_amount_val}${data_unit}`,
        validity_days: Number(validity_days),
        price_usd: Number(price_usd),
      };
    });

    const valid = normalized.filter(n => n.ok);

    console.log(`Preparing to upsert ${valid.length} valid packages (skipped ${packages.length - valid.length})`);

    if (valid.length > 0) {
      console.log('Normalized sample:', valid[0]);
    }

    const products = valid.map((n) => ({
      airlo_package_id: n.id,
      name: n.name,
      country_code: n.country_code,
      country_name: n.country_name,
      data_amount: n.data_amount,
      validity_days: n.validity_days,
      price_usd: n.price_usd,
      features: {
        coverage: n.country_name,
        speed: '4G/5G',
        activation: 'Instant',
      },
      is_popular: n.price_usd >= 10 && n.price_usd <= 30,
    }));

    console.log(`Upserting ${products.length} products...`);

    // Upsert products (insert or update if exists)
    const { data: upsertedData, error } = await supabase
      .from('products')
      .upsert(products, { 
        onConflict: 'airlo_package_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Successfully synced ${upsertedData?.length || 0} products`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: upsertedData?.length || 0,
        products: upsertedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in airlo-products function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});