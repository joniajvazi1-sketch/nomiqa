import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Full CSV content embedded (Column E = Recommended retail price)
const CSV_DATA = `"Country Region","Package Id",Type,"Net Price","Recommended retail price",Data,SMS,Voice,Networks
"United States",change-in-3days-unlimited,sim,5.7,12,Unlimited,0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-5days-unlimited,sim,8.6,19.5,Unlimited,0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-7days-unlimited,sim,11.6,28,Unlimited,0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-10days-unlimited,sim,16.1,35,Unlimited,0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-15days-unlimited,sim,23.6,49,Unlimited,0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-30days-unlimited,sim,46,69,Unlimited,0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-plus-15days-2gb,sim,3.3,12.5,"2 GB",20,40,"T-Mobile [5G]"
"United States",change-plus-7days-1gb,sim,1.7,7,"1 GB",10,20,"T-Mobile [5G]"
"United States",change-plus-30days-3gb,sim,4.5,16,"3 GB",30,60,"T-Mobile [5G]"
"United States",change-plus-30days-5gb,sim,7,22.5,"5 GB",50,100,"T-Mobile [5G]"
"United States",change-plus-30days-10gb,sim,12.6,34.5,"10 GB",100,200,"T-Mobile [5G]"
"United States",change-plus-30days-20gb,sim,20.4,49,"20 GB",200,400,"T-Mobile [5G]"
"United States",change-plus-365days-10gb,sim,40.5,49,"10 GB",30,75,"T-Mobile [5G]"
"United States",change-in-7days-1gb,sim,1.9,4.5,"1 GB",0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-15days-2gb,sim,2.8,7,"2 GB",0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-30days-5gb,sim,5.1,14,"5 GB",0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-30days-10gb,sim,7.7,23,"10 GB",0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-30days-20gb,sim,13.2,37,"20 GB",0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
"United States",change-in-30days-3gb,sim,3.5,9,"3 GB",0,0,"T-Mobile [5G], Verizon [5G], U.S. Cellular [5G]"
France,elan-7days-1gb,sim,0.8,4.5,"1 GB",0,0,"Orange [4G]"
France,elan-15days-2gb,sim,1.5,6,"2 GB",0,0,"Orange [4G]"
France,elan-30days-3gb,sim,2.1,7,"3 GB",0,0,"Orange [4G]"
France,elan-30days-5gb,sim,3.2,11,"5 GB",0,0,"Orange [4G]"
France,elan-30days-10gb,sim,4.6,16,"10 GB",0,0,"Orange [4G]"
France,elan-30days-20gb,sim,7.8,23.5,"20 GB",0,0,"Orange [4G]"
China,chinacom-15days-unlimited,sim,22.4,49,Unlimited,0,0,"China Unicom [5G]"
China,chinacom-5days-unlimited,sim,8.3,20.5,Unlimited,0,0,"China Unicom [5G]"
China,chinacom-3days-unlimited,sim,5.4,12.5,Unlimited,0,0,"China Unicom [5G]"
China,chinacom-10days-unlimited,sim,15.3,35,Unlimited,0,0,"China Unicom [5G]"
China,chinacom-7days-unlimited,sim,11.1,29.5,Unlimited,0,0,"China Unicom [5G]"
China,chinacom-30days-unlimited,sim,43.6,72.5,Unlimited,0,0,"China Unicom [5G]"
China,chinacom-7days-1gb,sim,1.2,4.5,"1 GB",0,0,"China Unicom [5G]"
China,chinacom-15days-2gb,sim,2.3,8,"2 GB",0,0,"China Unicom [5G]"
China,chinacom-30days-3gb,sim,3.2,10.5,"3 GB",0,0,"China Unicom [5G]"
China,chinacom-30days-5gb,sim,4.9,15.5,"5 GB",0,0,"China Unicom [5G]"
China,chinacom-30days-10gb,sim,7.3,26.5,"10 GB",0,0,"China Unicom [5G]"
China,chinacom-30days-20gb,sim,12.6,40,"20 GB",0,0,"China Unicom [5G]"
Albania,hej-telecom-7days-1gb,sim,2.5,4.5,"1 GB",0,0,"One Albania [4G]"
Albania,hej-telecom-15days-2gb,sim,4.5,7,"2 GB",0,0,"One Albania [4G]"
Albania,hej-telecom-30days-3gb,sim,5.7,9,"3 GB",0,0,"One Albania [4G]"
Albania,hej-telecom-30days-5gb,sim,8.5,13,"5 GB",0,0,"One Albania [4G]"
Albania,hej-telecom-30days-10gb,sim,13.2,22,"10 GB",0,0,"One Albania [4G]"
Tunisia,el-jem-communications-7days-1gb,sim,1.8,4.5,"1 GB",0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-15days-2gb,sim,3.6,7,"2 GB",0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-30days-3gb,sim,4.7,8.5,"3 GB",0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-30days-5gb,sim,7,12,"5 GB",0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-30days-10gb,sim,10.9,20,"10 GB",0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-30days-20gb,sim,19,31.5,"20 GB",0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-3days-unlimited,sim,7.8,20.5,Unlimited,0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-5days-unlimited,sim,12.2,32.5,Unlimited,0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-7days-unlimited,sim,16.6,40.5,Unlimited,0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-10days-unlimited,sim,23.2,47,Unlimited,0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-15days-unlimited,sim,34.2,63,Unlimited,0,0,"Orange [LTE], Ooredoo [5G]"
Tunisia,el-jem-communications-30days-unlimited,sim,67.2,99,Unlimited,0,0,"Orange [LTE], Ooredoo [5G]"
Nepal,namaste-mobile-7days-1gb,sim,1.3,4.5,"1 GB",0,0,"Ncell [4G], Nepal Telecom [4G]"
Nepal,namaste-mobile-15days-2gb,sim,2.5,6.5,"2 GB",0,0,"Ncell [4G], Nepal Telecom [4G]"
Nepal,namaste-mobile-30days-3gb,sim,3.1,7.5,"3 GB",0,0,"Ncell [4G], Nepal Telecom [4G]"
Nepal,namaste-mobile-30days-5gb,sim,4.5,11,"5 GB",0,0,"Ncell [4G], Nepal Telecom [4G]"
Nepal,namaste-mobile-30days-10gb,sim,6.6,18,"10 GB",0,0,"Ncell [4G], Nepal Telecom [4G]"
Nepal,namaste-mobile-30days-20gb,sim,11.3,29,"20 GB",0,0,"Ncell [4G], Nepal Telecom [4G]"`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Parsing CSV data...');
    
    const lines = CSV_DATA.trim().split('\n');
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
