import { supabase } from '../lib/supabase';
import { sendEmailViaN8N, EmailPayload } from './n8nEmailService';

export interface EmailCampaignPayload {
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
 * Send a single email via N8N
 * @param toEmail Recipient email address
 * @param subject Email subject
 * @param htmlBody HTML email body
 * @param fromEmail Optional sender email (defaults to user's email)
 */
export const sendSingleEmail = async (
  toEmail: string,
  subject: string,
  htmlBody: string,
  fromEmail?: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  
  // Get user email if fromEmail not provided
  let senderEmail = fromEmail;
  
  if (!senderEmail && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        senderEmail = user.email;
      }
    } catch (error) {
      console.warn('Could not fetch user email:', error);
    }
  }

  // Fallback to a default if still no email
  if (!senderEmail) {
    senderEmail = 'noreply@locallead.app';
  }

  const payload: EmailPayload = {
    fromEmail: senderEmail,
    toEmail,
    subject,
    message: htmlBody
  };

  return await sendEmailViaN8N(payload);
};

/**
 * Send email campaign - simplified to use N8N for single emails
 */
export const sendEmailCampaign = async (
  leadIds: string[], 
  templateId?: string, 
  campaignId?: string,
  overrides?: { customSubject?: string; customBody?: string }
) => {
  if (!supabase) throw new Error("Supabase not configured");

  try {
    console.log('📧 Starting email campaign...', { leadCount: leadIds.length, useN8N: USE_N8N });

    // Fetch leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds);

    if (leadsError) throw leadsError;
    if (!leads || leads.length === 0) throw new Error('No leads found');

    // Get user info for fromEmail
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fromEmail = user.email || 'noreply@locallead.app';

    // Process each lead
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      try {
        const subject = overrides?.customSubject || 'Message from LocalLead';
        const body = overrides?.customBody || '<p>Hello!</p>';

        // Use N8N if configured, otherwise use Supabase fallback
        let result;
        if (USE_N8N && N8N_WEBHOOK_URL) {
          console.log(`📤 Sending via N8N to ${lead.email}`);
          result = await sendSingleEmail(lead.email, subject, body, fromEmail);
        } else {
          console.log(`📤 Sending via Supabase to ${lead.email}`);
          result = await sendEmailViaSupabase(lead.email, subject, body);
        }

        if (result.success) {
          sent++;
          results.push({
            leadId: lead.id,
            status: 'sent',
            email: lead.email
          });

          // Log to database
          await supabase.from('outreach_logs').insert({
            user_id: user.id,
            lead_id: lead.id,
            campaign_id: campaignId || null,
            channel: 'email',
            status: 'sent',
            subject: subject,
            body: body
          });
        } else {
          failed++;
          results.push({
            leadId: lead.id,
            status: 'failed',
            email: lead.email,
            error: result.error
          });
        }

      } catch (error: any) {
        console.error(`❌ Failed to send to ${lead.email}:`, error);
        failed++;
        results.push({
          leadId: lead.id,
          status: 'failed',
          email: lead.email,
          error: error.message
        });
      }
    }

    return {
      success: true,
      total: leads.length,
      sent,
      failed,
      skipped: 0,
      results,
      provider: USE_N8N ? 'n8n' : 'supabase'
    };

  } catch (error) {
    console.error('❌ Email campaign error:', error);
    throw error;
  }
};

/**
 * Send via Supabase Edge Function (Fallback)
 */
const sendEmailViaSupabase = async (
  toEmail: string,
  subject: string,
  body: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  if (!supabase) throw new Error("Supabase not configured");

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { toEmail, subject, body }
    });

    if (error) throw error;

    return { success: true, message: 'Email sent via Supabase' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
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
