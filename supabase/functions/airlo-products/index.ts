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

interface AirloCountry {
  slug: string;
  country_code: string;
  title: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
  operators: AirloOperator[];
}

interface AirloCoverage {
  name: string;
  code: string;
  networks?: Array<{ name: string; types: string[] }>;
}

interface AirloOperator {
  id: number;
  type: 'local' | 'global';
  title: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
  coverages?: AirloCoverage[];
  packages: AirloPackage[];
}

interface AirloPackage {
  id: string;
  title: string;
  data: string;
  price: number;
  amount: number;
  day: number;
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

async function fetchAirloPackages(baseUrl: string, accessToken: string, tokenType: string): Promise<AirloCountry[]> {
  console.log('Fetching all packages from Airlo with pagination (no type filter)...');
  
  let allPackages: AirloCountry[] = [];
  let page = 1;
  let hasMore = true;
  const limit = 100;
  
  while (hasMore) {
    console.log(`Fetching packages - page ${page}...`);
    
    const response = await fetch(`${baseUrl}/v2/packages?limit=${limit}&page=${page}`, {
      headers: {
        'Authorization': `${tokenType} ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Airlo packages error (${response.status}):`, error);
      throw new Error(`Failed to fetch packages: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const packages = data.data || [];
    
    console.log(`Page ${page}: Fetched ${packages.length} packages`);
    
    if (packages.length > 0) {
      allPackages = [...allPackages, ...packages];
      page++;
      
      // Check if there are more pages
      if (data.meta && data.meta.last_page && page > data.meta.last_page) {
        hasMore = false;
      } else if (packages.length < limit) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }
  
  console.log(`Total packages fetched: ${allPackages.length}`);
  return allPackages;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Sync initiated by admin user');

    console.log('Preparing Airlo products sync...');

    const preferredEnv = (Deno.env.get('AIRLO_ENV')?.toLowerCase() === 'sandbox') ? 'sandbox' : 'prod';
    const envs = [preferredEnv, preferredEnv === 'prod' ? 'sandbox' : 'prod'];

    let packages: AirloCountry[] = [];
    let lastError: any = null;

    for (const env of envs) {
      const baseUrl = env === 'sandbox' 
        ? 'https://sandbox-partners-api.airalo.com' 
        : 'https://partners-api.airalo.com';

      console.log(`Starting Airlo products sync from ${baseUrl} (${env})...`);

      try {
        const { accessToken, tokenType } = await getAirloAccessToken(baseUrl);
        try {
          packages = await fetchAirloPackages(baseUrl, accessToken, tokenType);
          console.log(`Fetched ${packages.length} countries from ${env}`);
          break;
        } catch (pkgErr) {
          const msg = pkgErr instanceof Error ? pkgErr.message : String(pkgErr);
          console.warn(`First package fetch failed on ${env}: ${msg}. Retrying with a fresh token...`);
          const { accessToken: atk2, tokenType: tt2 } = await getAirloAccessToken(baseUrl);
          packages = await fetchAirloPackages(baseUrl, atk2, tt2);
          console.log(`Fetched ${packages.length} countries from ${env} on retry`);
          break;
        }
      } catch (e) {
        lastError = e;
        console.error(`Sync attempt with ${env} failed:`, e);
      }
    }

    if (packages.length === 0) {
      throw lastError || new Error('Failed to fetch packages from all environments');
    }

    // Extract packages from nested operators structure with operator info
    const allPackages: any[] = [];
    let localCount = 0;
    let regionalCount = 0;
    
    for (const country of packages) {
      // For regional/global packages, country_code is empty - use slug instead
      const isRegional = !country.country_code || country.country_code === '';
      const countryCode = country.country_code || country.slug?.toUpperCase() || 'GLOBAL';
      const countryName = country.title;
      const countryImageUrl = country.image?.url || null;
      
      if (!country.operators || !Array.isArray(country.operators)) continue;
      
      for (const operator of country.operators) {
        if (!operator.packages || !Array.isArray(operator.packages)) continue;
        
        const operatorName = operator.title || null;
        const operatorImageUrl = operator.image?.url || null;
        
        // Determine package type from operator type or regional detection
        const packageType = isRegional || operator.type === 'global' ? 'regional' : 'local';
        
        // Extract coverages for regional packages
        const coverages = operator.coverages?.map(c => ({
          name: c.name,
          code: c.code,
        })) || null;
        
        for (const pkg of operator.packages) {
          if (packageType === 'regional') {
            regionalCount++;
          } else {
            localCount++;
          }
          
          allPackages.push({
            id: pkg.id,
            name: pkg.title || pkg.data,
            country_code: countryCode,
            country_name: countryName,
            country_image_url: countryImageUrl,
            operator_name: operatorName,
            operator_image_url: operatorImageUrl,
            data_amount: pkg.data || `${pkg.amount}MB`,
            validity_days: pkg.day,
            price_usd: pkg.price,
            package_type: packageType,
            coverages: coverages,
          });
        }
      }
    }

    console.log(`Extracted packages: ${localCount} local, ${regionalCount} regional`);

    const valid = allPackages.filter(pkg => 
      pkg.id && pkg.country_code && pkg.country_name && pkg.data_amount && pkg.validity_days && pkg.price_usd
    ).map(pkg => ({
      ...pkg,
      country_image_url: pkg.country_image_url || null,
      operator_name: pkg.operator_name || null,
      operator_image_url: pkg.operator_image_url || null,
    }));

    console.log(`Preparing to upsert ${valid.length} valid packages (skipped ${allPackages.length - valid.length})`);

    if (valid.length > 0) {
      console.log('Normalized sample:', valid[0]);
      // Log a regional sample if available
      const regionalSample = valid.find(p => p.package_type === 'regional');
      if (regionalSample) {
        console.log('Regional sample:', regionalSample);
      }
    }

    const products = valid.map((n) => ({
      airlo_package_id: n.id,
      name: n.name,
      country_code: n.country_code,
      country_name: n.country_name,
      data_amount: n.data_amount,
      validity_days: n.validity_days,
      price_usd: n.price_usd,
      package_type: n.package_type,
      coverages: n.coverages,
      country_image_url: n.country_image_url,
      operator_name: n.operator_name,
      operator_image_url: n.operator_image_url,
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

    const upsertedLocal = upsertedData?.filter(p => p.package_type === 'local').length || 0;
    const upsertedRegional = upsertedData?.filter(p => p.package_type === 'regional').length || 0;

    console.log(`Successfully synced ${upsertedData?.length || 0} products (${upsertedLocal} local, ${upsertedRegional} regional)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: upsertedData?.length || 0,
        local: upsertedLocal,
        regional: upsertedRegional,
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