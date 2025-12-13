import { supabase } from '../../lib/supabase';
import { AppSettings } from '../../types';

export const profileRepository = {
  async getSettings(userId: string): Promise<AppSettings | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error fetching profile:', error);
      return null;
    }

    if (!data) return null;

    return {
      userName: data.full_name || '',
      companyName: data.company_name || 'Content Spark',
      dailyEmailLimit: data.daily_email_limit || 50,
      offerings: data.offerings || [],
      googleSheetsConnected: data.google_sheets_config?.enabled || false,
      googleSheetId: data.google_sheets_config?.sheet_id || '',
      n8nWebhookUrl: data.n8n_webhook_url || '',
      n8nEnrichmentWebhook: data.n8n_enrichment_webhook || '',
      hunterApiKey: data.hunter_api_key || ''
    };
  },

  async updateSettings(userId: string, settings: AppSettings) {
    if (!supabase) return;

    const updates = {
      full_name: settings.userName,
      company_name: settings.companyName,
      daily_email_limit: settings.dailyEmailLimit,
      offerings: settings.offerings,
      google_sheets_config: {
        enabled: settings.googleSheetsConnected,
        sheet_id: settings.googleSheetId
      },
      n8n_webhook_url: settings.n8nWebhookUrl || null,
      n8n_enrichment_webhook: settings.n8nEnrichmentWebhook || null,
      hunter_api_key: settings.hunterApiKey || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }
};
