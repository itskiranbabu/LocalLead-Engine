// Follows Deno/Supabase Edge Function structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured. Please add it to Edge Function secrets.");
    }

    // Initialize Supabase client
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { 
        global: { 
          headers: { 
            Authorization: req.headers.get('Authorization') || '' 
          } 
        } 
      }
    )

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { leadIds, templateId, campaignId, customSubject, customBody } = await req.json()

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "leadIds array is required" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Processing email send for ${leadIds.length} leads by user ${user.id}`);

    // Initialize Resend
    const resend = new Resend(resendKey);

    // Fetch Leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
    
    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ error: "No leads found with provided IDs" }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Fetch Template if ID provided
    let template = null;
    if (templateId) {
      const { data, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (templateError) {
        console.warn("Template fetch error:", templateError);
      } else {
        template = data;
      }
    }

    // Fetch Profile for "From" Name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.warn("Profile fetch error:", profileError);
    }

    const fromName = profile?.company_name || profile?.full_name || "LocalLead Engine";
    
    // IMPORTANT: Change this to your verified Resend domain
    // For now using Resend's test domain
    const fromEmail = "onboarding@resend.dev";

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const lead of leads) {
      if (!lead.email) {
        console.warn(`Lead ${lead.id} has no email, skipping`);
        results.push({ 
          id: lead.id, 
          status: 'skipped', 
          reason: 'No email address' 
        });
        continue;
      }

      let subject = customSubject || template?.subject || "Hello from {{your_company}}";
      let body = customBody || template?.body || "Hi {{contact_name}},\n\nI wanted to reach out...";

      // Variable Replacement with fallbacks
      const contactName = lead.name || 'there';
      const businessName = lead.business_type || lead.name || 'your business';
      const city = lead.city || 'your area';
      const yourName = profile?.full_name || 'the team';
      const yourCompany = profile?.company_name || 'LocalLead Engine';

      body = body
        .replace(/{{contact_name}}/g, contactName)
        .replace(/{{business_name}}/g, businessName)
        .replace(/{{city}}/g, city)
        .replace(/{{your_name}}/g, yourName)
        .replace(/{{your_company}}/g, yourCompany);
          
      subject = subject
        .replace(/{{business_name}}/g, businessName)
        .replace(/{{city}}/g, city)
        .replace(/{{your_company}}/g, yourCompany);

      try {
        console.log(`Sending email to ${lead.email}...`);
        
        const { data, error } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [lead.email],
          subject: subject,
          html: body.replace(/\n/g, '<br>'),
        });

        if (error) {
          throw error;
        }

        console.log(`Email sent successfully to ${lead.email}, ID: ${data?.id}`);

        // Log Success
        await supabase.from('outreach_logs').insert({
          user_id: user.id,
          lead_id: lead.id,
          campaign_id: campaignId || null,
          channel: 'email',
          status: 'sent',
          provider_id: data?.id,
          subject: subject,
          body: body
        });

        results.push({ 
          id: lead.id, 
          email: lead.email,
          status: 'sent',
          provider_id: data?.id 
        });
        
        successCount++;

      } catch (err: any) {
        console.error(`Error sending to ${lead.email}:`, err);
        
        results.push({ 
          id: lead.id, 
          email: lead.email,
          status: 'failed', 
          error: err.message || 'Unknown error'
        });
        
        // Log Failure
        await supabase.from('outreach_logs').insert({
          user_id: user.id,
          lead_id: lead.id,
          campaign_id: campaignId || null,
          channel: 'email',
          status: 'failed',
          error_message: err.message || 'Unknown error'
        });

        failCount++;
      }

      // Rate limiting: wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Email sending complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: leads.length,
        sent: successCount,
        failed: failCount,
        results: results
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error("Edge function error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})