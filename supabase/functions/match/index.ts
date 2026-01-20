// Supabase Edge Function for session matching
// This function handles the matching queue and pairs users

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchRequest {
  sessionId: string;
  duration: 25 | 50 | 75;
  startTime: string;
  timezone?: string;
  preferredPartnerIds?: string[];
}

interface QueueEntry {
  user_id: string;
  session_id: string;
  duration: number;
  start_time: string;
  requested_at: string;
  timezone: string | null;
  preferred_partner_ids: string[] | null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as MatchRequest;

    // Add user to matching queue
    const { error: queueError } = await supabase
      .from('matching_queue')
      .upsert({
        user_id: user.id,
        session_id: body.sessionId,
        duration: body.duration,
        start_time: body.startTime,
        requested_at: new Date().toISOString(),
        timezone: body.timezone || null,
        preferred_partner_ids: body.preferredPartnerIds || null,
      });

    if (queueError) {
      return new Response(
        JSON.stringify({ error: 'Failed to join queue', details: queueError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to find a match
    const { data: candidates, error: candidatesError } = await supabase
      .from('matching_queue')
      .select('*')
      .eq('duration', body.duration)
      .neq('user_id', user.id)
      .gte('start_time', new Date(new Date(body.startTime).getTime() - 5 * 60 * 1000).toISOString())
      .lte('start_time', new Date(new Date(body.startTime).getTime() + 5 * 60 * 1000).toISOString())
      .order('requested_at', { ascending: true });

    if (candidatesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to find candidates', details: candidatesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!candidates || candidates.length === 0) {
      // No match found, user stays in queue
      return new Response(
        JSON.stringify({
          matched: false,
          message: 'Waiting for a match...',
          sessionId: body.sessionId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score candidates and pick the best one
    const scoredCandidates = candidates.map((candidate: QueueEntry) => {
      let score = 100;

      // Prefer users who prefer this user
      if (candidate.preferred_partner_ids?.includes(user.id)) {
        score += 50;
      }

      // Prefer same timezone
      if (body.timezone && candidate.timezone === body.timezone) {
        score += 20;
      }

      // Prefer users waiting longer (fairness)
      const waitTime = Date.now() - new Date(candidate.requested_at).getTime();
      score += Math.min(waitTime / 1000, 30);

      return { candidate, score };
    }).sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    const matchedPartner = scoredCandidates[0].candidate as QueueEntry;

    // Remove both users from queue
    await supabase
      .from('matching_queue')
      .delete()
      .in('user_id', [user.id, matchedPartner.user_id]);

    // Add both users to the session as participants
    await supabase
      .from('session_participants')
      .upsert([
        {
          session_id: body.sessionId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        },
        {
          session_id: body.sessionId,
          user_id: matchedPartner.user_id,
          joined_at: new Date().toISOString(),
        },
      ]);

    // Update session status to active
    await supabase
      .from('sessions')
      .update({ status: 'active' })
      .eq('id', body.sessionId);

    return new Response(
      JSON.stringify({
        matched: true,
        sessionId: body.sessionId,
        partnerId: matchedPartner.user_id,
        matchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
