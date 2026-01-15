import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    
    // Verify user with anon client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !currentUser) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { email, self_delete } = body;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SELF-DELETION: User deletes their own account
    if (self_delete === true) {
      console.log(`[GDPR_DELETE] Self-deletion requested by user=${currentUser.id} (${currentUser.email})`);

      // Delete all user data in order (respecting FK constraints)
      const deletionResults: Record<string, string> = {};

      // 1. Delete coverage confirmations (references signal_logs)
      const { error: e1 } = await supabaseAdmin
        .from('coverage_confirmations')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.coverage_confirmations = e1 ? 'error' : 'deleted';

      // 2. Delete connection events
      const { error: e2 } = await supabaseAdmin
        .from('connection_events')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.connection_events = e2 ? 'error' : 'deleted';

      // 3. Delete signal logs
      const { error: e3 } = await supabaseAdmin
        .from('signal_logs')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.signal_logs = e3 ? 'error' : 'deleted';

      // 4. Delete offline contribution queue
      const { error: e4 } = await supabaseAdmin
        .from('offline_contribution_queue')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.offline_queue = e4 ? 'error' : 'deleted';

      // 5. Delete contribution sessions
      const { error: e5 } = await supabaseAdmin
        .from('contribution_sessions')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.contribution_sessions = e5 ? 'error' : 'deleted';

      // 6. Delete user challenge progress
      const { error: e6 } = await supabaseAdmin
        .from('user_challenge_progress')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.challenge_progress = e6 ? 'error' : 'deleted';

      // 7. Delete user points
      const { error: e7 } = await supabaseAdmin
        .from('user_points')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.user_points = e7 ? 'error' : 'deleted';

      // 8. Delete leaderboard cache
      const { error: e8 } = await supabaseAdmin
        .from('leaderboard_cache')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.leaderboard_cache = e8 ? 'error' : 'deleted';

      // 9. Delete user spending
      const { error: e9 } = await supabaseAdmin
        .from('user_spending')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.user_spending = e9 ? 'error' : 'deleted';

      // 10. Delete profile
      const { error: e10 } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.profiles = e10 ? 'error' : 'deleted';

      // 11. Anonymize orders (keep for business records but remove PII)
      const { error: e11 } = await supabaseAdmin
        .from('orders')
        .update({
          email: `deleted-${currentUser.id.substring(0, 8)}@privacy.deleted`,
          user_id: null,
          visitor_id: null,
          referral_code: null,
          access_token_invalidated: true
        })
        .eq('user_id', currentUser.id);
      deletionResults.orders_anonymized = e11 ? 'error' : 'anonymized';

      // 12. Delete affiliate account if exists
      const { error: e12 } = await supabaseAdmin
        .from('affiliates')
        .delete()
        .eq('user_id', currentUser.id);
      deletionResults.affiliates = e12 ? 'error' : 'deleted';

      // 13. Delete the auth user
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(currentUser.id);
      if (deleteAuthError) {
        console.error('Failed to delete auth user:', deleteAuthError);
        return new Response(JSON.stringify({ 
          error: 'Failed to complete account deletion',
          partial_deletion: deletionResults
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Audit log
      console.log(`[GDPR_DELETE] Completed self-deletion for user=${currentUser.id}:`, deletionResults);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data deleted',
        deleted: deletionResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ADMIN DELETION: Admin deletes another user's account
    // Check admin status with fail-secure approach
    let isAdmin = false;
    
    try {
      const { data: roleResult, error: roleError } = await supabaseAdmin.rpc('has_role', {
        _user_id: currentUser.id,
        _role: 'admin'
      });

      if (roleError) {
        // FAIL-SECURE: On any error, deny access
        console.error('[SECURITY] Role check error - DENYING ACCESS:', roleError);
        console.warn(`[AUDIT] Admin role check failed for user=${currentUser.id} email=${currentUser.email}`);
        return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
          status: 403, // Changed from 500 to 403 - fail secure
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      isAdmin = roleResult === true;
    } catch (err) {
      // FAIL-SECURE: On any exception, deny access
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
    
    // Log admin action attempt BEFORE execution
    console.log(`[AUDIT] Admin ${currentUser.id} (${currentUser.email}) attempting to delete user: ${email}`);

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required for admin deletion' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prevent admin from deleting themselves via admin route
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

    // Delete user data (same cascade as self-delete)
    await supabaseAdmin.from('coverage_confirmations').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('connection_events').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('signal_logs').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('offline_contribution_queue').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('contribution_sessions').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('user_challenge_progress').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('user_points').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('leaderboard_cache').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('user_spending').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('profiles').delete().eq('user_id', targetUser.id);
    await supabaseAdmin.from('affiliates').delete().eq('user_id', targetUser.id);
    
    // Anonymize orders
    await supabaseAdmin
      .from('orders')
      .update({
        email: `deleted-${targetUser.id.substring(0, 8)}@privacy.deleted`,
        user_id: null,
        visitor_id: null,
        referral_code: null,
        access_token_invalidated: true
      })
      .eq('user_id', targetUser.id);

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
    if (deleteError) throw deleteError;

    console.log(`[AUDIT] Admin deletion: ${email} (${targetUser.id}) by admin ${currentUser.id} (${currentUser.email})`);

    return new Response(JSON.stringify({ success: true, message: `User ${email} deleted` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
