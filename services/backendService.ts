import { supabase } from '../lib/supabase';

export interface EmailPayload {
  leadIds: string[];
  templateId?: string;
  campaignId?: string;
  overrides?: {
    customSubject?: string;
    customBody?: string;
  }
}

// N8N Webhook URL - Set via environment variable
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const USE_N8N = import.meta.env.VITE_USE_N8N === 'true';

/**
 * Send email campaign via N8N workflow
 */
export const sendEmailCampaignViaN8N = async (
  leadIds: string[], 
  templateId?: string, 
  campaignId?: string,
  overrides?: { customSubject?: string; customBody?: string }
) => {
  if (!supabase) throw new Error("Supabase not configured");
  if (!N8N_WEBHOOK_URL) throw new Error("N8N webhook URL not configured");

  try {
    console.log('📧 Starting N8N email campaign...', { leadCount: leadIds.length });

    // Fetch leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds);

    if (leadsError) throw leadsError;
    if (!leads || leads.length === 0) throw new Error('No leads found');

    // Fetch template
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      template = templateData;
    }

    // Fetch profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Prepare payload
    const payload = {
      leads: leads,
      template: template,
      profile: profile || { 
        full_name: user.email?.split('@')[0], 
        company_name: 'LocalLead Engine',
        email: user.email 
      },
      campaignId: campaignId,
      customSubject: overrides?.customSubject,
      customBody: overrides?.customBody,
      userId: user.id
    };

    console.log('📤 Sending to N8N...');

    // Call N8N webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ N8N response:', result);

    // Log to database
    if (result.results && Array.isArray(result.results)) {
      const logs = result.results.map((r: any) => ({
        user_id: user.id,
        lead_id: r.leadId,
        campaign_id: campaignId || null,
        channel: 'email',
        status: r.status,
        subject: overrides?.customSubject || template?.subject,
        body: overrides?.customBody || template?.body,
        error_message: r.error || null,
      }));

      await supabase.from('outreach_logs').insert(logs);
    }

    return {
      success: true,
      total: result.total || leads.length,
      sent: result.sent || 0,
      failed: result.failed || 0,
      skipped: result.skipped || 0,
      results: result.results || [],
      provider: 'n8n'
    };

  } catch (error) {
    console.error('❌ N8N error:', error);
    throw error;
  }
};

/**
 * Send via Supabase Edge Function (Fallback)
 */
export const sendEmailCampaignViaSupabase = async (
  leadIds: string[], 
  templateId?: string, 
  campaignId?: string,
  overrides?: { customSubject?: string; customBody?: string }
) => {
  if (!supabase) throw new Error("Supabase not configured");

  console.log('📧 Using Supabase fallback...');

  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { leadIds, templateId, campaignId, ...overrides }
  });

  if (error) throw error;

  return { ...data, provider: 'supabase' };
};

/**
 * Main email sender with automatic fallback
 */
export const sendEmailCampaign = async (
  leadIds: string[], 
  templateId?: string, 
  campaignId?: string,
  overrides?: { customSubject?: string; customBody?: string }
) => {
  // Try N8N first if configured
  if (USE_N8N && N8N_WEBHOOK_URL) {
    try {
      console.log('🔄 Using N8N...');
      return await sendEmailCampaignViaN8N(leadIds, templateId, campaignId, overrides);
    } catch (error) {
      console.warn('⚠️ N8N failed, using Supabase...', error);
    }
  }

  // Fallback to Supabase
  console.log('🔄 Using Supabase...');
  return await sendEmailCampaignViaSupabase(leadIds, templateId, campaignId, overrides);
};

/**
 * Batch email sender with progress tracking
 */
export const sendEmailCampaignInBatches = async (
  leadIds: string[],
  templateId?: string,
  campaignId?: string,
  overrides?: { customSubject?: string; customBody?: string },
  batchSize: number = 10,
  delayMs: number = 2000,
  onProgress?: (sent: number, total: number) => void
) => {
  const batches: string[][] = [];
  
  for (let i = 0; i < leadIds.length; i += batchSize) {
    batches.push(leadIds.slice(i, i + batchSize));
  }

  console.log(`📦 Processing ${leadIds.length} leads in ${batches.length} batches`);

  let totalSent = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  const allResults: any[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📤 Batch ${i + 1}/${batches.length}`);

    try {
      const result = await sendEmailCampaign(batch, templateId, campaignId, overrides);
      
      totalSent += result.sent || 0;
      totalFailed += result.failed || 0;
      totalSkipped += result.skipped || 0;
      
      if (result.results) allResults.push(...result.results);
      if (onProgress) onProgress(totalSent, leadIds.length);

      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      totalFailed += batch.length;
    }
  }

  return {
    success: true,
    total: leadIds.length,
    sent: totalSent,
    failed: totalFailed,
    skipped: totalSkipped,
    results: allResults,
    batches: batches.length
  };
};