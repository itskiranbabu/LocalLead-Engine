import { supabase } from '../../lib/supabase';
import { Campaign } from '../../types';

export const campaignRepository = {
  async getAll(userId: string): Promise<Campaign[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      niche: row.niche,
      location: row.location,
      status: row.status,
      createdAt: row.created_at
    }));
  },

  async create(userId: string, campaign: Campaign) {
    if (!supabase) return;

    const { error } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        name: campaign.name,
        description: campaign.description,
        niche: campaign.niche,
        location: campaign.location,
        status: campaign.status,
        created_at: campaign.createdAt
      });

    if (error) throw error;
  },

  async update(userId: string, campaign: Campaign) {
    if (!supabase) return;
    const { error } = await supabase
      .from('campaigns')
      .update({
        name: campaign.name,
        description: campaign.description,
        status: campaign.status
      })
      .eq('id', campaign.id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async delete(userId: string, id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }
};