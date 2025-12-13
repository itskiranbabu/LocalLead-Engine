import { EmailLog } from './emailCampaignService';
import { getSettings } from './storageService';
import { BusinessLead } from '../types';

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

  // Send email via N8N webhook
  async sendEmail(emailLog: EmailLog & { to: string }): Promise<EmailSendResponse> {
    const webhookUrl = await this.getN8NWebhookUrl();
    
    if (!webhookUrl) {
      console.warn('N8N webhook URL not configured. Email not sent.');
      return {
        success: false,
        message: 'N8N webhook URL not configured',
        error: 'Please configure N8N webhook URL in Settings',
      };
    }

    if (!emailLog.to) {
      return {
        success: false,
        message: 'No recipient email address',
        error: 'Email log missing recipient address',
      };
    }

    try {
      const settings = await getSettings();

      // Match N8N workflow's expected format:
      // body.toEmail, body.subject, body.message
      const payload = {
        body: {
          toEmail: emailLog.to,
          subject: emailLog.subject,
          message: emailLog.body,
          from_name: settings.userName || 'LocalLead Engine',
          campaignId: emailLog.campaignId,
          leadId: emailLog.leadId,
          emailLogId: emailLog.id,
        }
      };

      console.log('Sending email via N8N:', {
        to: emailLog.to,
        subject: emailLog.subject,
        webhookUrl: webhookUrl.substring(0, 50) + '...',
        payload,
      });

      // Send to N8N webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('N8N Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.status} ${response.statusText} - ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: responseText };
      }

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

  // Send single email directly (for Leads Manager)
  async sendSingleEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<EmailSendResponse> {
    const webhookUrl = await this.getN8NWebhookUrl();
    
    if (!webhookUrl) {
      return {
        success: false,
        message: 'N8N webhook URL not configured',
        error: 'Please configure N8N webhook URL in Settings',
      };
    }

    try {
      const settings = await getSettings();

      // Match N8N workflow's expected format
      const payload = {
        body: {
          toEmail: to,
          subject: subject,
          message: body,
          from_name: settings.userName || 'LocalLead Engine',
        }
      };

      console.log('Sending single email via N8N:', { 
        to, 
        subject,
        payload,
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('N8N Response:', {
        status: response.status,
        body: responseText,
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.status} - ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: responseText };
      }

      console.log('Single email sent successfully:', result);

      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('Failed to send single email:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Send WhatsApp message (placeholder for future implementation)
  async sendWhatsApp(
    phone: string,
    message: string
  ): Promise<EmailSendResponse> {
    // TODO: Implement WhatsApp sending via N8N or WhatsApp Business API
    console.log('WhatsApp sending not yet implemented:', { phone, message });
    return {
      success: false,
      message: 'WhatsApp sending not yet implemented',
      error: 'Feature coming soon',
    };
  }

  // Send batch of emails with delay
  async sendBatch(emailLogs: (EmailLog & { to: string })[], delayMs: number = 2000): Promise<{
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

  // Process scheduled emails (call this periodically)
  async processScheduledEmails(): Promise<void> {
    const logsData = localStorage.getItem(this.logsKey);
    if (!logsData) return;

    const logs: (EmailLog & { to?: string })[] = JSON.parse(logsData);
    const now = new Date();

    // Find emails scheduled for now or earlier
    const scheduledEmails = logs.filter(log => {
      if (log.status !== 'scheduled') return false;
      if (!log.to) return false; // Skip if no recipient email
      
      const scheduledDate = new Date(log.scheduledFor);
      return scheduledDate <= now;
    }) as (EmailLog & { to: string })[];

    if (scheduledEmails.length === 0) {
      console.log('No emails scheduled for sending');
      return;
    }

    console.log(`Processing ${scheduledEmails.length} scheduled emails...`);

    // Send emails with 2-second delay between each
    const result = await this.sendBatch(scheduledEmails, 2000);

    console.log(`Email batch complete: ${result.sent} sent, ${result.failed} failed`);
  }
}

export const emailSendingService = new EmailSendingService();
