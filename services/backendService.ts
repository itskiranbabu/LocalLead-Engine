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

export const sendEmailCampaign = async (
  leadIds: string[], 
  templateId?: string, 
  campaignId?: string,
  overrides?: { customSubject?: string; customBody?: string }
) => {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { 
        leadIds, 
        templateId, 
        campaignId,
        ...overrides 
    }
  });

  if (error) throw error;
  return data;
};