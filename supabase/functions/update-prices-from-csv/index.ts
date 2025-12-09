import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated and has admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Reading CSV file from disk...');
    
    // Read the CSV file from the function directory
    const csvPath = new URL('./updated-prices.csv', import.meta.url).pathname;
    const csvContent = await Deno.readTextFile(csvPath);
    
    console.log('Parsing CSV data (semicolon-separated)...');
    const lines = csvContent.trim().split('\n');
    
    // Parse CSV - semicolon separated with columns:
    // id;airlo_package_id;name;country_code;country_name;data_amount;validity_days;price_usd;...
    const csvPrices: Map<string, number> = new Map();
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = line.split(';');
      if (fields.length < 8) continue;
      
      const airloPackageId = fields[1]?.trim();
      const priceUsd = parseFloat(fields[7]?.trim());
      
      if (airloPackageId && !isNaN(priceUsd)) {
        csvPrices.set(airloPackageId, priceUsd);
      }
    }
    
    console.log(`Parsed ${csvPrices.size} products from CSV`);
    
    // Fetch all current prices from database
    const { data: dbProducts, error: fetchError } = await supabase
      .from('products')
      .select('airlo_package_id, price_usd');
    
    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }
    
    // Find price differences
    const priceChanges: Array<{
      package_id: string;
      old_price: number;
      new_price: number;
    }> = [];
    
    for (const product of dbProducts || []) {
      const csvPrice = csvPrices.get(product.airlo_package_id);
      if (csvPrice !== undefined) {
        const dbPrice = parseFloat(product.price_usd);
        if (Math.abs(csvPrice - dbPrice) > 0.001) {
          priceChanges.push({
            package_id: product.airlo_package_id,
            old_price: dbPrice,
            new_price: csvPrice
          });
        }
      }
    }
    
    console.log(`Found ${priceChanges.length} price changes`);
    
    // Apply updates
    let updatedCount = 0;
    for (const change of priceChanges) {
      const { error } = await supabase
        .from('products')
        .update({ price_usd: change.new_price, updated_at: new Date().toISOString() })
        .eq('airlo_package_id', change.package_id);
      
      if (!error) {
        updatedCount++;
        console.log(`✓ ${change.package_id}: $${change.old_price} → $${change.new_price}`);
      } else {
        console.error(`✗ Failed ${change.package_id}:`, error);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Price changes found: ${priceChanges.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        changes_found: priceChanges.length,
        updated: updatedCount,
        details: priceChanges.slice(0, 50) // Return first 50 for visibility
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating prices:', error);
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
