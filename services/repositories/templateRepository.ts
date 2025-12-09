import { supabase } from '../../lib/supabase';
import { EmailTemplate } from '../../types';

export const templateRepository = {
  async getAll(userId: string): Promise<EmailTemplate[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      type: row.type,
      channel: row.channel || 'email'
    }));
  },

  async create(userId: string, template: EmailTemplate) {
    if (!supabase) return;
    const { error } = await supabase
      .from('email_templates')
      .insert({
        user_id: userId,
        name: template.name,
        subject: template.subject,
        body: template.body,
        type: template.type,
        channel: template.channel
      });
    if (error) throw error;
  },

  async update(userId: string, template: EmailTemplate) {
    if (!supabase) return;
    const { error } = await supabase
      .from('email_templates')
      .update({
        name: template.name,
        subject: template.subject,
        body: template.body,
        type: template.type,
        channel: template.channel
      })
      .eq('id', template.id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async delete(userId: string, id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('email_templates').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }
};