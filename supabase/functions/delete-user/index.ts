import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Helper: delete from a table, catching errors so one failure doesn't block the rest */
async function safeDelete(
  admin: ReturnType<typeof createClient>,
  table: string,
  column: string,
  userId: string,
  results: Record<string, string>
) {
  try {
    const { error } = await admin.from(table).delete().eq(column, userId);
    results[table] = error ? `error: ${error.message}` : 'deleted';
  } catch (e) {
    results[table] = `exception: ${(e as Error).message}`;
  }
}

/** Delete all user data from every table that references user_id */
async function deleteAllUserData(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Order matters for FK constraints: children before parents
  // 1. Tables referencing signal_logs
  await safeDelete(admin, 'coverage_confirmations', 'user_id', userId, results);

  // 2. Tables referencing contribution_sessions
  await safeDelete(admin, 'connection_events', 'user_id', userId, results);
  await safeDelete(admin, 'offline_contribution_queue', 'user_id', userId, results);

  // 3. Signal & contribution data
  await safeDelete(admin, 'signal_logs', 'user_id', userId, results);
  await safeDelete(admin, 'contribution_sessions', 'user_id', userId, results);

  // 4. Points & rewards
  await safeDelete(admin, 'user_challenge_progress', 'user_id', userId, results);
  await safeDelete(admin, 'user_points', 'user_id', userId, results);
  await safeDelete(admin, 'user_daily_limits', 'user_id', userId, results);
  await safeDelete(admin, 'user_monthly_limits', 'user_id', userId, results);
  await safeDelete(admin, 'daily_checkins', 'user_id', userId, results);
  await safeDelete(admin, 'social_task_claims', 'user_id', userId, results);

  // 5. Leaderboard & levels
  await safeDelete(admin, 'leaderboard_cache', 'user_id', userId, results);
  await safeDelete(admin, 'user_contribution_levels', 'user_id', userId, results);

  // 6. Speed tests & mining
  await safeDelete(admin, 'speed_test_results', 'user_id', userId, results);
  await safeDelete(admin, 'mining_logs', 'user_id', userId, results);

  // 7. Preferences & settings
  await safeDelete(admin, 'notification_preferences', 'user_id', userId, results);
  await safeDelete(admin, 'user_collection_preferences', 'user_id', userId, results);
  await safeDelete(admin, 'user_goals', 'user_id', userId, results);
  await safeDelete(admin, 'spin_wheel_results', 'user_id', userId, results);

  // 8. Spending, roles & profile
  await safeDelete(admin, 'user_spending', 'user_id', userId, results);
  await safeDelete(admin, 'user_roles', 'user_id', userId, results);
  await safeDelete(admin, 'profiles', 'user_id', userId, results);

  // 9. Referral data (both as referrer and referred)
  try {
    const { error } = await admin.from('referral_commissions').delete().eq('referrer_user_id', userId);
    results['referral_commissions_as_referrer'] = error ? `error: ${error.message}` : 'deleted';
  } catch (e) { results['referral_commissions_as_referrer'] = `exception: ${(e as Error).message}`; }

  try {
    const { error } = await admin.from('referral_commissions').delete().eq('referred_user_id', userId);
    results['referral_commissions_as_referred'] = error ? `error: ${error.message}` : 'deleted';
  } catch (e) { results['referral_commissions_as_referred'] = `exception: ${(e as Error).message}`; }

  try {
    const { error } = await admin.from('pending_referral_bonuses').delete().eq('referrer_user_id', userId);
    results['pending_referral_bonuses_referrer'] = error ? `error: ${error.message}` : 'deleted';
  } catch (e) { results['pending_referral_bonuses_referrer'] = `exception: ${(e as Error).message}`; }

  try {
    const { error } = await admin.from('pending_referral_bonuses').delete().eq('referred_user_id', userId);
    results['pending_referral_bonuses_referred'] = error ? `error: ${error.message}` : 'deleted';
  } catch (e) { results['pending_referral_bonuses_referred'] = `exception: ${(e as Error).message}`; }

  try {
    const { error } = await admin.from('affiliate_referrals').delete().eq('registered_user_id', userId);
    results['affiliate_referrals_as_registered'] = error ? `error: ${error.message}` : 'deleted';
  } catch (e) { results['affiliate_referrals_as_registered'] = `exception: ${(e as Error).message}`; }

  // 10. Security audit log (anonymize user_id rather than delete for audit trail)
  try {
    const { error } = await admin.from('security_audit_log').delete().eq('user_id', userId);
    results['security_audit_log'] = error ? `error: ${error.message}` : 'deleted';
  } catch (e) { results['security_audit_log'] = `exception: ${(e as Error).message}`; }

  // 11. Anonymize orders (keep for business records but remove PII)
  try {
    const { error } = await admin
      .from('orders')
      .update({
        email: `deleted-${userId.substring(0, 8)}@privacy.deleted`,
        user_id: null,
        visitor_id: null,
        referral_code: null,
        access_token_invalidated: true
      })
      .eq('user_id', userId);
    results['orders_anonymized'] = error ? `error: ${error.message}` : 'anonymized';
  } catch (e) { results['orders_anonymized'] = `exception: ${(e as Error).message}`; }

  // 12. Affiliate account
  await safeDelete(admin, 'affiliates', 'user_id', userId, results);

  return results;
}

serve(async (req) => {
  console.log('[delete-user] Request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !currentUser) {
      console.error('[delete-user] Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { email, self_delete } = body;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ─── SELF-DELETION ───
    if (self_delete === true) {
      console.log(`[GDPR_DELETE] Self-deletion requested by user=${currentUser.id} (${currentUser.email})`);

      const deletionResults = await deleteAllUserData(supabaseAdmin, currentUser.id);

      // Delete the auth user last
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(currentUser.id);
      if (deleteAuthError) {
        console.error('[delete-user] Failed to delete auth user:', deleteAuthError);
        return new Response(JSON.stringify({ 
          error: 'Failed to complete account deletion',
          partial_deletion: deletionResults
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[GDPR_DELETE] Completed self-deletion for user=${currentUser.id}:`, deletionResults);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data deleted',
        deleted: deletionResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ADMIN DELETION ───
    let isAdmin = false;
    
    try {
      const { data: roleResult, error: roleError } = await supabaseAdmin.rpc('has_role', {
        _user_id: currentUser.id,
        _role: 'admin'
      });

      if (roleError) {
        console.error('[SECURITY] Role check error - DENYING ACCESS:', roleError);
        return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      isAdmin = roleResult === true;
    } catch (err) {
      console.error('[SECURITY] Exception during role check - DENYING ACCESS:', err);
      return new Response(JSON.stringify({ error: 'Authorization check failed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isAdmin) {
      console.warn(`[SECURITY] Unauthorized admin delete attempt by user=${currentUser.id} email=${currentUser.email}`);
      return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[AUDIT] Admin ${currentUser.id} (${currentUser.email}) attempting to delete user: ${email}`);

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required for admin deletion' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (email === currentUser.email) {
      return new Response(JSON.stringify({ error: 'Use self_delete to delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const targetUser = users.users.find(u => u.email === email);
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Delete all user data using shared helper
    const deletionResults = await deleteAllUserData(supabaseAdmin, targetUser.id);

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
    if (deleteError) throw deleteError;

    console.log(`[AUDIT] Admin deletion: ${email} (${targetUser.id}) by admin ${currentUser.id} (${currentUser.email}):`, deletionResults);

    return new Response(JSON.stringify({ success: true, message: `User ${email} deleted`, deleted: deletionResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[delete-user] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
