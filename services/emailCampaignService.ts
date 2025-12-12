import { BusinessLead } from '../types';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // e.g., ['name', 'business', 'city']
  category: 'cold_outreach' | 'follow_up' | 'meeting_request' | 'custom';
  createdAt: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  steps: EmailSequenceStep[];
  active: boolean;
  createdAt: string;
}

export interface EmailSequenceStep {
  id: string;
  order: number;
  templateId: string;
  delayDays: number; // Days after previous step (0 for first step)
  condition?: 'no_reply' | 'no_open' | 'always';
}

export interface EmailCampaign {
  id: string;
  name: string;
  sequenceId: string;
  leadIds: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  campaignId: string;
  leadId: string;
  templateId: string;
  sequenceStepId: string;
  subject: string;
  body: string;
  status: 'scheduled' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  scheduledFor: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  repliedAt?: string;
  error?: string;
  metadata?: {
    opens: number;
    clicks: number;
    lastOpenedAt?: string;
    lastClickedAt?: string;
  };
}

// Pre-built email templates
export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'cold_outreach_1',
    name: 'Cold Outreach - Professional & Friendly',
    subject: 'Quick question about {{business}}',
    body: `Hey {{name}} team! 👋

Kiran from Content Spark here. Came across your {{category}} in {{city}} - really impressive! 💪

I help local businesses grow their customer base through smart digital strategies. Would love to chat about some ideas specifically for {{business}}.

Check out what we do: tr.ee/itskiranbabu 🚀

Free for a 10-min call this week? ☕

Cheers!
Kiran Babu
Content Spark`,
    variables: ['name', 'business', 'category', 'city'],
    category: 'cold_outreach',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cold_outreach_2',
    name: 'Cold Outreach - Value Focused',
    subject: 'Helping {{business}} get more customers in {{city}}',
    body: `Hi {{name}},

I noticed {{business}} in {{city}} and wanted to reach out.

Most businesses in {{category}} struggle with consistent customer acquisition. I help solve that through proven digital strategies.

Here's what we do: tr.ee/itskiranbabu 🚀

Would you be open to a quick 15-minute call to discuss how we could help {{business}} grow?

Best regards,
Kiran Babu
Content Spark`,
    variables: ['name', 'business', 'category', 'city'],
    category: 'cold_outreach',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'follow_up_1',
    name: 'Follow-up - Gentle Reminder',
    subject: 'Re: Quick question about {{business}}',
    body: `Hey {{name}},

Just following up on my message from earlier this week.

I know you're busy, so I'll keep this quick - I have 3 specific ideas that could help {{business}} get more customers in {{city}}.

Would a 10-minute call work for you? Happy to work around your schedule! ☕

Cheers!
Kiran Babu
Content Spark

P.S. Here's what we do: tr.ee/itskiranbabu`,
    variables: ['name', 'business', 'city'],
    category: 'follow_up',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'follow_up_2',
    name: 'Follow-up - Case Study Approach',
    subject: 'How we helped [similar business] in {{city}}',
    body: `Hi {{name}},

Quick success story that might interest you:

We recently helped a {{category}} business in {{city}} increase their customer base by 40% in just 2 months using smart digital strategies.

Given that {{business}} is in the same industry, I thought you might find this relevant.

Want to hear how we did it? 📈

Let me know if you'd like to chat!

Best,
Kiran Babu
Content Spark

What we do: tr.ee/itskiranbabu`,
    variables: ['name', 'business', 'category', 'city'],
    category: 'follow_up',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'follow_up_3',
    name: 'Follow-up - Final Touchpoint',
    subject: 'Last message from me - {{business}}',
    body: `Hey {{name}}! 👋

Last message from me - I promise! 😊

I genuinely think there's some untapped potential for {{business}} in {{city}}. If you're interested in exploring growth strategies, I'm here.

If not, no worries at all! Wishing you all the best! 🚀

Cheers!
Kiran Babu
Content Spark

tr.ee/itskiranbabu`,
    variables: ['name', 'business', 'city'],
    category: 'follow_up',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'meeting_request_1',
    name: 'Meeting Request - Coffee Chat',
    subject: 'Coffee chat about {{business}}?',
    body: `Hi {{name}},

I'd love to learn more about {{business}} and share some growth ideas that might be helpful.

Are you available for a quick coffee chat next week? I'm flexible with timing and happy to meet near {{city}}.

Let me know what works for you! ☕

Best,
Kiran Babu
Content Spark

What we do: tr.ee/itskiranbabu`,
    variables: ['name', 'business', 'city'],
    category: 'meeting_request',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'meeting_request_2',
    name: 'Meeting Request - Virtual Call',
    subject: 'Quick 15-min call about {{business}}?',
    body: `Hey {{name}}! 👋

I have some specific ideas for {{business}} that I'd love to share.

Would you be up for a quick 15-minute virtual call this week? I can work around your schedule.

Here's my calendar: [Your calendar link]

Looking forward to chatting!

Cheers!
Kiran Babu
Content Spark

tr.ee/itskiranbabu 🚀`,
    variables: ['name', 'business'],
    category: 'meeting_request',
    createdAt: new Date().toISOString(),
  },
];

// Default email sequences
export const DEFAULT_SEQUENCES: EmailSequence[] = [
  {
    id: 'sequence_cold_3step',
    name: '3-Step Cold Outreach (Professional)',
    active: true,
    steps: [
      {
        id: 'step_1',
        order: 1,
        templateId: 'cold_outreach_1',
        delayDays: 0,
        condition: 'always',
      },
      {
        id: 'step_2',
        order: 2,
        templateId: 'follow_up_1',
        delayDays: 3,
        condition: 'no_reply',
      },
      {
        id: 'step_3',
        order: 3,
        templateId: 'follow_up_2',
        delayDays: 7,
        condition: 'no_reply',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sequence_cold_5step',
    name: '5-Step Cold Outreach (Aggressive)',
    active: true,
    steps: [
      {
        id: 'step_1',
        order: 1,
        templateId: 'cold_outreach_1',
        delayDays: 0,
        condition: 'always',
      },
      {
        id: 'step_2',
        order: 2,
        templateId: 'follow_up_1',
        delayDays: 2,
        condition: 'no_reply',
      },
      {
        id: 'step_3',
        order: 3,
        templateId: 'follow_up_2',
        delayDays: 5,
        condition: 'no_reply',
      },
      {
        id: 'step_4',
        order: 4,
        templateId: 'meeting_request_1',
        delayDays: 9,
        condition: 'no_reply',
      },
      {
        id: 'step_5',
        order: 5,
        templateId: 'follow_up_3',
        delayDays: 14,
        condition: 'no_reply',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sequence_cold_4step',
    name: '4-Step Cold Outreach (Balanced)',
    active: true,
    steps: [
      {
        id: 'step_1',
        order: 1,
        templateId: 'cold_outreach_2',
        delayDays: 0,
        condition: 'always',
      },
      {
        id: 'step_2',
        order: 2,
        templateId: 'follow_up_1',
        delayDays: 3,
        condition: 'no_reply',
      },
      {
        id: 'step_3',
        order: 3,
        templateId: 'follow_up_2',
        delayDays: 7,
        condition: 'no_reply',
      },
      {
        id: 'step_4',
        order: 4,
        templateId: 'meeting_request_2',
        delayDays: 12,
        condition: 'no_reply',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

class EmailCampaignService {
  private storageKey = 'email_campaigns';
  private templatesKey = 'email_templates';
  private sequencesKey = 'email_sequences';
  private logsKey = 'email_logs';

  // Initialize with default templates and sequences
  async initialize() {
    const templates = await this.getTemplates();
    if (templates.length === 0) {
      localStorage.setItem(this.templatesKey, JSON.stringify(DEFAULT_TEMPLATES));
    }

    const sequences = await this.getSequences();
    if (sequences.length === 0) {
      localStorage.setItem(this.sequencesKey, JSON.stringify(DEFAULT_SEQUENCES));
    }
  }

  // Templates
  async getTemplates(): Promise<EmailTemplate[]> {
    const data = localStorage.getItem(this.templatesKey);
    return data ? JSON.parse(data) : [];
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt'>): Promise<EmailTemplate> {
    const templates = await this.getTemplates();
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    localStorage.setItem(this.templatesKey, JSON.stringify(templates));
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    templates[index] = { ...templates[index], ...updates };
    localStorage.setItem(this.templatesKey, JSON.stringify(templates));
    return templates[index];
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(this.templatesKey, JSON.stringify(filtered));
    return filtered.length < templates.length;
  }

  // Sequences
  async getSequences(): Promise<EmailSequence[]> {
    const data = localStorage.getItem(this.sequencesKey);
    return data ? JSON.parse(data) : [];
  }

  async getSequence(id: string): Promise<EmailSequence | null> {
    const sequences = await this.getSequences();
    return sequences.find(s => s.id === id) || null;
  }

  async createSequence(sequence: Omit<EmailSequence, 'id' | 'createdAt'>): Promise<EmailSequence> {
    const sequences = await this.getSequences();
    const newSequence: EmailSequence = {
      ...sequence,
      id: `sequence_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    sequences.push(newSequence);
    localStorage.setItem(this.sequencesKey, JSON.stringify(sequences));
    return newSequence;
  }

  async updateSequence(id: string, updates: Partial<EmailSequence>): Promise<EmailSequence | null> {
    const sequences = await this.getSequences();
    const index = sequences.findIndex(s => s.id === id);
    if (index === -1) return null;

    sequences[index] = { ...sequences[index], ...updates };
    localStorage.setItem(this.sequencesKey, JSON.stringify(sequences));
    return sequences[index];
  }

  async deleteSequence(id: string): Promise<boolean> {
    const sequences = await this.getSequences();
    const filtered = sequences.filter(s => s.id !== id);
    localStorage.setItem(this.sequencesKey, JSON.stringify(filtered));
    return filtered.length < sequences.length;
  }

  // Campaigns
  async getCampaigns(): Promise<EmailCampaign[]> {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  async getCampaign(id: string): Promise<EmailCampaign | null> {
    const campaigns = await this.getCampaigns();
    return campaigns.find(c => c.id === id) || null;
  }

  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<EmailCampaign> {
    const campaigns = await this.getCampaigns();
    const newCampaign: EmailCampaign = {
      ...campaign,
      id: `campaign_${Date.now()}`,
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        bounced: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    campaigns.push(newCampaign);
    localStorage.setItem(this.storageKey, JSON.stringify(campaigns));
    return newCampaign;
  }

  async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
    const campaigns = await this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) return null;

    campaigns[index] = {
      ...campaigns[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(campaigns));
    return campaigns[index];
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const campaigns = await this.getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return filtered.length < campaigns.length;
  }

  // Email Logs
  async getEmailLogs(campaignId?: string): Promise<EmailLog[]> {
    const data = localStorage.getItem(this.logsKey);
    const logs: EmailLog[] = data ? JSON.parse(data) : [];
    return campaignId ? logs.filter(log => log.campaignId === campaignId) : logs;
  }

  async createEmailLog(log: Omit<EmailLog, 'id'>): Promise<EmailLog> {
    const logs = await this.getEmailLogs();
    const newLog: EmailLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    logs.push(newLog);
    localStorage.setItem(this.logsKey, JSON.stringify(logs));
    return newLog;
  }

  async updateEmailLog(id: string, updates: Partial<EmailLog>): Promise<EmailLog | null> {
    const logs = await this.getEmailLogs();
    const index = logs.findIndex(l => l.id === id);
    if (index === -1) return null;

    logs[index] = { ...logs[index], ...updates };
    localStorage.setItem(this.logsKey, JSON.stringify(logs));
    return logs[index];
  }

  // Template variable replacement
  replaceVariables(template: string, lead: BusinessLead, customVars?: Record<string, string>): string {
    let result = template;
    
    // Default variables from lead
    const variables: Record<string, string> = {
      name: lead.name,
      business: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website || '',
      address: lead.address,
      city: lead.city,
      category: lead.category,
      ...customVars,
    };

    // Replace all {{variable}} patterns
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  // Schedule emails for a campaign
  async scheduleEmails(campaignId: string, leads: BusinessLead[], sequenceId: string): Promise<EmailLog[]> {
    const sequence = await this.getSequence(sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    const logs: EmailLog[] = [];
    const now = new Date();

    for (const lead of leads) {
      if (!lead.email) continue; // Skip leads without email

      for (const step of sequence.steps) {
        const template = await this.getTemplate(step.templateId);
        if (!template) continue;

        const scheduledDate = new Date(now);
        scheduledDate.setDate(scheduledDate.getDate() + step.delayDays);

        const log = await this.createEmailLog({
          campaignId,
          leadId: lead.id,
          templateId: step.templateId,
          sequenceStepId: step.id,
          subject: this.replaceVariables(template.subject, lead),
          body: this.replaceVariables(template.body, lead),
          status: 'scheduled',
          scheduledFor: scheduledDate.toISOString(),
        });

        logs.push(log);
      }
    }

    return logs;
  }

  // Get campaign analytics
  async getCampaignAnalytics(campaignId: string) {
    const logs = await this.getEmailLogs(campaignId);
    const campaign = await this.getCampaign(campaignId);

    if (!campaign) return null;

    const analytics = {
      totalScheduled: logs.length,
      sent: logs.filter(l => 
        l.status === 'sent' || 
        l.status === 'opened' || 
        l.status === 'clicked' || 
        l.status === 'replied'
      ).length,
      opened: logs.filter(l => 
        l.status === 'opened' || 
        l.status === 'clicked' || 
        l.status === 'replied'
      ).length,
      clicked: logs.filter(l => 
        l.status === 'clicked' || 
        l.status === 'replied'
      ).length,
      replied: logs.filter(l => l.status === 'replied').length,
      bounced: logs.filter(l => l.status === 'bounced').length,
      failed: logs.filter(l => l.status === 'failed').length,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
      bounceRate: 0,
    };

    const sent = analytics.sent;
    if (sent > 0) {
      analytics.openRate = (analytics.opened / sent) * 100;
      analytics.clickRate = (analytics.clicked / sent) * 100;
      analytics.replyRate = (analytics.replied / sent) * 100;
      analytics.bounceRate = (analytics.bounced / sent) * 100;
    }

    return analytics;
  }
}

export const emailCampaignService = new EmailCampaignService();
