import { EmailLog } from './emailCampaignService';

interface N8NConfig {
  webhookUrl: string;
  enabled: boolean;
}

interface EmailSendRequest {
  emailLogId: string;
  campaignId: string;
  leadId: string;
  to: string;
  subject: string;
  body: string;
  callbackUrl: string;
}

interface EmailSendResponse {
  success: boolean;
  message: string;
  emailLogId?: string;
  error?: string;
}

class EmailSendingService {
  private configKey = 'n8n_email_config';

  // Get N8N configuration
  getConfig(): N8NConfig {
    const data = localStorage.getItem(this.configKey);
    if (data) {
      return JSON.parse(data);
    }
    return {
      webhookUrl: '',
      enabled: false,
    };
  }

  // Save N8N configuration
  saveConfig(config: N8NConfig): void {
    localStorage.setItem(this.configKey, JSON.stringify(config));
  }

  // Send email via N8N webhook
  async sendEmail(emailLog: EmailLog): Promise<EmailSendResponse> {
    const config = this.getConfig();

    if (!config.enabled || !config.webhookUrl) {
      return {
        success: false,
        message: 'N8N email sending is not configured',
        error: 'Please configure N8N webhook URL in Settings',
      };
    }

    try {
      // Prepare email data
      const emailData: EmailSendRequest = {
        emailLogId: emailLog.id,
        campaignId: emailLog.campaignId,
        leadId: emailLog.leadId,
        to: emailLog.body.match(/To: (.+)/)?.[1] || '', // Extract email from body
        subject: emailLog.subject,
        body: emailLog.body,
        callbackUrl: `${window.location.origin}/api/email-tracking/status`,
      };

      // Send to N8N webhook
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_email',
          ...emailData,
        }),
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Email sent successfully via N8N',
        emailLogId: emailLog.id,
      };
    } catch (error: any) {
      console.error('Email sending error:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message,
      };
    }
  }

  // Send batch of emails
  async sendBatch(emailLogs: EmailLog[]): Promise<EmailSendResponse[]> {
    const results: EmailSendResponse[] = [];

    for (const emailLog of emailLogs) {
      const result = await this.sendEmail(emailLog);
      results.push(result);

      // Add delay between emails to avoid rate limiting
      await this.delay(1000); // 1 second delay
    }

    return results;
  }

  // Handle email status update from N8N
  async handleStatusUpdate(data: {
    emailLogId: string;
    status: 'sent' | 'failed' | 'bounced';
    sentAt?: string;
    error?: string;
  }): Promise<void> {
    // This will be called by N8N webhook callback
    const { emailLogId, status, sentAt, error } = data;

    // Update email log in localStorage
    const logsKey = 'email_logs';
    const logsData = localStorage.getItem(logsKey);
    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const logIndex = logs.findIndex(l => l.id === emailLogId);

    if (logIndex === -1) return;

    // Update log
    logs[logIndex] = {
      ...logs[logIndex],
      status,
      sentAt: sentAt || new Date().toISOString(),
      error,
    };

    localStorage.setItem(logsKey, JSON.stringify(logs));

    // Update campaign stats
    await this.updateCampaignStats(logs[logIndex].campaignId);
  }

  // Handle email open tracking
  async handleEmailOpen(data: {
    emailLogId: string;
    openedAt: string;
  }): Promise<void> {
    const { emailLogId, openedAt } = data;

    const logsKey = 'email_logs';
    const logsData = localStorage.getItem(logsKey);
    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const logIndex = logs.findIndex(l => l.id === emailLogId);

    if (logIndex === -1) return;

    // Update log
    logs[logIndex] = {
      ...logs[logIndex],
      status: 'opened',
      openedAt,
      metadata: {
        ...logs[logIndex].metadata,
        opens: (logs[logIndex].metadata?.opens || 0) + 1,
        lastOpenedAt: openedAt,
      },
    };

    localStorage.setItem(logsKey, JSON.stringify(logs));

    // Update campaign stats
    await this.updateCampaignStats(logs[logIndex].campaignId);
  }

  // Handle email click tracking
  async handleEmailClick(data: {
    emailLogId: string;
    clickedAt: string;
    url: string;
  }): Promise<void> {
    const { emailLogId, clickedAt, url } = data;

    const logsKey = 'email_logs';
    const logsData = localStorage.getItem(logsKey);
    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const logIndex = logs.findIndex(l => l.id === emailLogId);

    if (logIndex === -1) return;

    // Update log
    logs[logIndex] = {
      ...logs[logIndex],
      status: 'clicked',
      clickedAt,
      metadata: {
        ...logs[logIndex].metadata,
        clicks: (logs[logIndex].metadata?.clicks || 0) + 1,
        lastClickedAt: clickedAt,
      },
    };

    localStorage.setItem(logsKey, JSON.stringify(logs));

    // Update campaign stats
    await this.updateCampaignStats(logs[logIndex].campaignId);
  }

  // Update campaign statistics
  private async updateCampaignStats(campaignId: string): Promise<void> {
    const campaignsKey = 'email_campaigns';
    const logsKey = 'email_logs';

    const campaignsData = localStorage.getItem(campaignsKey);
    const logsData = localStorage.getItem(logsKey);

    if (!campaignsData || !logsData) return;

    const campaigns = JSON.parse(campaignsData);
    const logs: EmailLog[] = JSON.parse(logsData);

    const campaignIndex = campaigns.findIndex((c: any) => c.id === campaignId);
    if (campaignIndex === -1) return;

    // Calculate stats from logs
    const campaignLogs = logs.filter(l => l.campaignId === campaignId);

    const stats = {
      sent: campaignLogs.filter(l => 
        l.status === 'sent' || 
        l.status === 'opened' || 
        l.status === 'clicked' || 
        l.status === 'replied'
      ).length,
      opened: campaignLogs.filter(l => 
        l.status === 'opened' || 
        l.status === 'clicked' || 
        l.status === 'replied'
      ).length,
      clicked: campaignLogs.filter(l => 
        l.status === 'clicked' || 
        l.status === 'replied'
      ).length,
      replied: campaignLogs.filter(l => l.status === 'replied').length,
      bounced: campaignLogs.filter(l => l.status === 'bounced').length,
    };

    campaigns[campaignIndex] = {
      ...campaigns[campaignIndex],
      stats,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(campaignsKey, JSON.stringify(campaigns));
  }

  // Process scheduled emails (call this periodically)
  async processScheduledEmails(): Promise<void> {
    const logsKey = 'email_logs';
    const logsData = localStorage.getItem(logsKey);

    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const now = new Date();

    // Find emails scheduled to be sent now
    const emailsToSend = logs.filter(log => {
      if (log.status !== 'scheduled') return false;
      const scheduledDate = new Date(log.scheduledFor);
      return scheduledDate <= now;
    });

    if (emailsToSend.length === 0) return;

    console.log(`Processing ${emailsToSend.length} scheduled emails...`);

    // Send emails in batches
    const results = await this.sendBatch(emailsToSend);

    console.log('Email sending results:', results);
  }

  // Utility: Delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test N8N connection
  async testConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.statusText}`);
      }

      return {
        success: true,
        message: 'N8N connection successful!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}

export const emailSendingService = new EmailSendingService();

// Auto-process scheduled emails every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    emailSendingService.processScheduledEmails();
  }, 60000); // Check every minute
}
