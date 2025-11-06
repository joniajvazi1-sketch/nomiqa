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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Reading CSV file from disk...');
    
    // Read the CSV file from the function directory
    const csvPath = new URL('./prices.csv', import.meta.url).pathname;
    const csvContent = await Deno.readTextFile(csvPath);
    
    console.log('Parsing CSV data...');
    const lines = csvContent.trim().split('\n');
    const updates: Array<{package_id: string, price: number, country: string}> = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handle quoted fields)
      const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
      if (!matches || matches.length < 5) continue;
      
      const fields = matches.map(m => m.replace(/^,?"?|"?$/g, '').replace(/""/g, '"'));
      
      const country = fields[0]?.trim();
      const packageId = fields[1]?.trim();
      const type = fields[2]?.trim();
      const recommendedPrice = fields[4]?.trim();
      
      // Only process 'sim' type packages (not topups)
      if (type === 'sim' && packageId && recommendedPrice) {
        const price = parseFloat(recommendedPrice);
        if (!isNaN(price)) {
          updates.push({ package_id: packageId, price, country });
        }
      }
    }
    
    console.log(`Parsed ${updates.length} price updates from ${new Set(updates.map(u => u.country)).size} countries`);
    
    // Update prices in batches
    let updatedCount = 0;
    let notFoundCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { data, error } = await supabase
          .from('products')
          .update({ price_usd: update.price })
          .eq('airlo_package_id', update.package_id)
          .select();
        
        if (!error && data && data.length > 0) {
          updatedCount++;
          console.log(`✓ ${update.country}: ${update.package_id} → $${update.price}`);
        } else if (!error && (!data || data.length === 0)) {
          notFoundCount++;
          console.log(`⊘ Not in DB: ${update.package_id}`);
        } else {
          console.error(`✗ Failed ${update.package_id}:`, error);
        }
      }
      
      console.log(`Progress: ${Math.min(i + batchSize, updates.length)} / ${updates.length}`);
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Successfully updated: ${updatedCount} products`);
    console.log(`Not found in DB: ${notFoundCount} products`);
    console.log(`Total processed: ${updates.length} updates`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedCount,
        not_found: notFoundCount,
        total: updates.length 
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
