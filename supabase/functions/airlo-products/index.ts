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

  const response = await fetch(`${baseUrl}/v2/packages?limit=50`, {
    headers: {
      'Authorization': `${tokenType} ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Airlo packages error:', error);
    throw new Error(`Failed to fetch packages: ${response.status}`);
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
    // Get Airlo access token
    const { accessToken, tokenType } = await getAirloAccessToken(baseUrl);

    // Fetch packages from Airlo
    packages = await fetchAirloPackages(baseUrl, accessToken, tokenType);
    console.log(`Fetched ${packages.length} packages from ${env}`);
    break; // success
  } catch (e) {
    lastError = e;
    console.error(`Sync attempt with ${env} failed:`, e);
  }
}

if (packages.length === 0) {
  throw lastError || new Error('Failed to fetch packages from all environments');
}

    // Transform and insert into database (only in-stock packages)
    const products = packages
      .filter(pkg => pkg.is_stock_available !== false)
      .map((pkg) => ({
        airlo_package_id: pkg.id,
        name: pkg.title,
        country_code: pkg.country.iso_code,
        country_name: pkg.country.name,
        data_amount: `${pkg.data.amount}${pkg.data.unit}`,
        validity_days: pkg.validity.amount,
        price_usd: pkg.price.amount,
        features: {
          coverage: pkg.country.name,
          speed: '4G/5G',
          activation: 'Instant',
        },
        is_popular: pkg.price.amount >= 10 && pkg.price.amount <= 30,
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