// Follows Deno/Supabase Edge Function structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders })
    }

    const { leadIds, templateId, campaignId, customSubject, customBody } = await req.json()
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendKey) {
        throw new Error("RESEND_API_KEY not set in Edge Function secrets.");
    }
    const resend = new Resend(resendKey);

    // Fetch Leads
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
    
    // Fetch Template if ID provided
    let template = null;
    if (templateId) {
        const { data } = await supabase.from('email_templates').select('*').eq('id', templateId).single();
        template = data;
    }

    // Fetch Profile for "From" Name
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const fromName = profile?.company_name || "LocalLead Engine";
    const fromEmail = "onboarding@resend.dev"; // Change this to your verified domain later

    const results = [];

    for (const lead of (leads || [])) {
        if (!lead.email) continue;

        let subject = customSubject || template?.subject || "Hello";
        let body = customBody || template?.body || "Hello";

        // Variable Replacement
        body = body
            .replace(/{{contact_name}}/g, lead.name)
            .replace(/{{business_name}}/g, lead.business_type || 'Business')
            .replace(/{{city}}/g, lead.city)
            .replace(/{{your_name}}/g, profile?.full_name || 'Me')
            .replace(/{{your_company}}/g, profile?.company_name || 'Content Spark');
            
        subject = subject
            .replace(/{{business_name}}/g, lead.name)
            .replace(/{{city}}/g, lead.city);

        try {
            const { data, error } = await resend.emails.send({
                from: `${fromName} <${fromEmail}>`,
                to: [lead.email],
                subject: subject,
                html: body.replace(/\n/g, '<br>'),
            });

            if (error) throw error;

            // Log Success
            await supabase.from('outreach_logs').insert({
                user_id: user.id,
                lead_id: lead.id,
                campaign_id: campaignId,
                channel: 'email',
                status: 'sent',
                provider_id: data?.id
            });
            results.push({ id: lead.id, status: 'sent' });

        } catch (err: any) {
             console.error("Error sending to " + lead.email, err);
             results.push({ id: lead.id, status: 'failed', error: err.message });
             
             await supabase.from('outreach_logs').insert({
                user_id: user.id,
                lead_id: lead.id,
                campaign_id: campaignId,
                channel: 'email',
                status: 'failed',
                error_message: err.message
            });
        }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})