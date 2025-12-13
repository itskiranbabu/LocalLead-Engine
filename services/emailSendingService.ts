import { EmailLog } from './emailCampaignService';
import { getSettings } from './storageService';

interface EmailSendRequest {
  action: string;
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
  private logsKey = 'email_logs';

  // Get N8N webhook URL from app settings
  async getN8NWebhookUrl(): Promise<string | null> {
    const settings = await getSettings();
    return settings.n8nWebhookUrl || null;
  }

  // Check if N8N is configured
  async isN8NConfigured(): Promise<boolean> {
    const webhookUrl = await this.getN8NWebhookUrl();
    return !!webhookUrl && webhookUrl.trim().length > 0;
  }

  // Get callback URL for tracking
  getCallbackUrl(): string {
    return `${window.location.origin}/api/email-tracking/status`;
  }

  // Send email via N8N webhook
  async sendEmail(emailLog: EmailLog): Promise<EmailSendResponse> {
    const webhookUrl = await this.getN8NWebhookUrl();
    
    if (!webhookUrl) {
      console.warn('N8N webhook URL not configured. Email not sent.');
      return {
        success: false,
        message: 'N8N webhook URL not configured',
        error: 'Please configure N8N webhook URL in Settings',
      };
    }

    try {
      // Extract recipient email from body (format: "To: email@example.com")
      const emailMatch = emailLog.body.match(/To:\s*([^\n]+)/);
      const recipientEmail = emailMatch ? emailMatch[1].trim() : '';

      if (!recipientEmail) {
        throw new Error('No recipient email found in email body');
      }

      // Prepare email data for N8N workflow
      const emailData: EmailSendRequest = {
        action: 'send_email',
        emailLogId: emailLog.id,
        campaignId: emailLog.campaignId,
        leadId: emailLog.leadId,
        to: recipientEmail,
        subject: emailLog.subject,
        body: emailLog.body,
        callbackUrl: this.getCallbackUrl(),
      };

      console.log('Sending email via N8N:', {
        to: recipientEmail,
        subject: emailLog.subject,
        webhookUrl: webhookUrl.substring(0, 50) + '...',
      });

      // Send to N8N webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Update log status to sent
      await this.updateEmailLog(emailLog.id, {
        status: 'sent',
        sentAt: new Date().toISOString(),
      });

      console.log('Email sent successfully via N8N:', result);

      return {
        success: true,
        message: 'Email sent successfully via N8N',
        emailLogId: emailLog.id,
      };
    } catch (error) {
      console.error('Failed to send email via N8N:', error);
      
      // Update log status to failed
      await this.updateEmailLog(emailLog.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Send batch of emails with delay
  async sendBatch(emailLogs: EmailLog[], delayMs: number = 2000): Promise<{
    sent: number;
    failed: number;
  }> {
    let sent = 0;
    let failed = 0;

    for (const log of emailLogs) {
      const result = await this.sendEmail(log);
      
      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Wait before sending next email (to avoid rate limits)
      if (delayMs > 0 && sent + failed < emailLogs.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return { sent, failed };
  }

  // Update email log
  async updateEmailLog(id: string, updates: Partial<EmailLog>): Promise<void> {
    const logsData = localStorage.getItem(this.logsKey);
    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const index = logs.findIndex(l => l.id === id);
    
    if (index === -1) return;

    logs[index] = { ...logs[index], ...updates };
    localStorage.setItem(this.logsKey, JSON.stringify(logs));
  }

  // Handle email open tracking
  async handleEmailOpen(emailLogId: string): Promise<void> {
    const logsData = localStorage.getItem(this.logsKey);
    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const log = logs.find(l => l.id === emailLogId);
    
    if (!log) return;

    // Update status to opened if not already
    if (log.status === 'sent') {
      await this.updateEmailLog(emailLogId, {
        status: 'opened',
        openedAt: new Date().toISOString(),
        metadata: {
          ...log.metadata,
          opens: (log.metadata?.opens || 0) + 1,
          lastOpenedAt: new Date().toISOString(),
        },
      });
    } else if (log.status === 'opened' || log.status === 'clicked' || log.status === 'replied') {
      // Just increment open count
      await this.updateEmailLog(emailLogId, {
        metadata: {
          ...log.metadata,
          opens: (log.metadata?.opens || 0) + 1,
          lastOpenedAt: new Date().toISOString(),
        },
      });
    }
  }

  // Handle email click tracking
  async handleEmailClick(emailLogId: string, url: string): Promise<void> {
    const logsData = localStorage.getItem(this.logsKey);
    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const log = logs.find(l => l.id === emailLogId);
    
    if (!log) return;

    // Update status to clicked if not already replied
    if (log.status !== 'replied') {
      await this.updateEmailLog(emailLogId, {
        status: 'clicked',
        clickedAt: new Date().toISOString(),
        metadata: {
          ...log.metadata,
          clicks: (log.metadata?.clicks || 0) + 1,
          lastClickedAt: new Date().toISOString(),
          lastClickedUrl: url,
        },
      });
    } else {
      // Just increment click count
      await this.updateEmailLog(emailLogId, {
        metadata: {
          ...log.metadata,
          clicks: (log.metadata?.clicks || 0) + 1,
          lastClickedAt: new Date().toISOString(),
          lastClickedUrl: url,
        },
      });
    }
  }

  // Process scheduled emails (call this periodically)
  async processScheduledEmails(): Promise<void> {
    const logsData = localStorage.getItem(this.logsKey);
    if (!logsData) return;

    const logs: EmailLog[] = JSON.parse(logsData);
    const now = new Date();

    // Find emails scheduled for now or earlier
    const scheduledEmails = logs.filter(log => {
      if (log.status !== 'scheduled') return false;
      
      const scheduledDate = new Date(log.scheduledFor);
      return scheduledDate <= now;
    });

    if (scheduledEmails.length === 0) {
      console.log('No emails scheduled for sending');
      return;
    }

    console.log(`Processing ${scheduledEmails.length} scheduled emails...`);

    // Send emails with 2 second delay between each
    const result = await this.sendBatch(scheduledEmails, 2000);
    
    console.log(`Sent ${result.sent} emails, ${result.failed} failed`);
  }

  // Get email logs
  async getEmailLogs(campaignId?: string): Promise<EmailLog[]> {
    const data = localStorage.getItem(this.logsKey);
    const logs: EmailLog[] = data ? JSON.parse(data) : [];
    return campaignId ? logs.filter(log => log.campaignId === campaignId) : logs;
  }

  // Test N8N connection
  async testN8NConnection(): Promise<{ success: boolean; message: string }> {
    const webhookUrl = await this.getN8NWebhookUrl();
    
    if (!webhookUrl) {
      return {
        success: false,
        message: 'N8N webhook URL not configured. Please add it in Settings.',
      };
    }

    try {
      console.log('Testing N8N connection:', webhookUrl);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection',
          test: true,
          message: 'Connection test from LocalLead Engine',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `N8N webhook returned ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        message: 'N8N connection successful! Your workflow is ready to send emails.',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error connecting to N8N',
      };
    }
  }

  // Get N8N status
  async getN8NStatus(): Promise<{
    configured: boolean;
    webhookUrl: string | null;
    ready: boolean;
  }> {
    const webhookUrl = await this.getN8NWebhookUrl();
    const configured = !!webhookUrl;

    return {
      configured,
      webhookUrl,
      ready: configured,
    };
  }
}

export const emailSendingService = new EmailSendingService();
