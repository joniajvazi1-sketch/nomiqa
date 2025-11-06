import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AirloAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
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

async function getAirloAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AIRLO_CLIENT_ID');
  const clientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');

  console.log('Requesting Airlo access token...');

  const response = await fetch('https://partners-api.airalo.com/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Airlo auth error:', error);
    throw new Error(`Failed to authenticate with Airlo: ${response.status}`);
  }

  const data: AirloAuthResponse = await response.json();
  console.log('Successfully obtained Airlo access token');
  return data.access_token;
}

async function fetchAirloPackages(accessToken: string): Promise<AirloPackage[]> {
  console.log('Fetching packages from Airlo...');

  const response = await fetch('https://partners-api.airalo.com/v2/packages?limit=50', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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

    console.log('Starting Airlo products sync from partners-api.airalo.com...');

    // Get Airlo access token
    const accessToken = await getAirloAccessToken();

    // Fetch packages from Airlo
    const packages = await fetchAirloPackages(accessToken);

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