import { supabase } from '../../lib/supabase';
import { BusinessLead } from '../../types';

export const leadRepository = {
  async getAll(userId: string): Promise<BusinessLead[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      rating: row.rating,
      website: row.website,
      phone: row.phone,
      email: row.email,
      status: row.status,
      source: row.source || 'Gemini Maps',
      category: row.business_type,
      notes: row.notes,
      addedAt: row.created_at,
      campaignId: row.campaign_id,
      potentialValue: row.pipeline_value_inr,
      score: row.score,
      tags: row.tags,
      enrichmentData: row.enrichment_data
    }));
  },

  async create(userId: string, leads: BusinessLead[]) {
    if (!supabase) return;

    const dbRows = leads.map(l => ({
      // We rely on DB to generate UUIDs if new, or usage passed ID if migrated
      user_id: userId,
      name: l.name,
      business_type: l.category,
      address: l.address,
      city: l.city,
      rating: l.rating,
      website: l.website,
      phone: l.phone,
      email: l.email,
      status: l.status,
      notes: l.notes,
      campaign_id: l.campaignId,
      pipeline_value_inr: l.potentialValue,
      score: l.score,
      tags: l.tags
    }));

    const { error } = await supabase
      .from('leads')
      .insert(dbRows);

    if (error) throw error;
  },

  async update(userId: string, lead: BusinessLead) {
    if (!supabase) return;

    const updates = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      notes: lead.notes,
      campaign_id: lead.campaignId,
      enrichment_data: lead.enrichmentData
    };

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', lead.id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async delete(userId: string, leadId: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};