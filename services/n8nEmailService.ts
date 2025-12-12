import axios from 'axios';

// N8N Webhook URL - configure this in Vercel environment variables
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

export interface EmailPayload {
  fromEmail: string;
  toEmail: string;
  subject: string;
  message: string; // HTML content
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Send email via N8N workflow
 * @param payload Email data including from, to, subject, and HTML message
 * @returns Promise with success status and message
 */
export const sendEmailViaN8N = async (payload: EmailPayload): Promise<EmailResponse> => {
  // Validate webhook URL is configured
  if (!N8N_WEBHOOK_URL) {
    console.error('N8N Webhook URL not configured. Please set VITE_N8N_WEBHOOK_URL in environment variables.');
    return {
      success: false,
      error: 'Email service not configured. Please contact administrator.'
    };
  }

  // Validate required fields
  if (!payload.toEmail || !payload.subject || !payload.message) {
    return {
      success: false,
      error: 'Missing required email fields (toEmail, subject, or message)'
    };
  }

  try {
    console.log('Sending email via N8N:', {
      to: payload.toEmail,
      subject: payload.subject,
      webhookUrl: N8N_WEBHOOK_URL
    });

    const response = await axios.post<EmailResponse>(
      N8N_WEBHOOK_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('N8N Email Response:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('N8N Email Error:', error);
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Email request timed out. Please try again.'
      };
    }

    if (error.response) {
      // Server responded with error
      return {
        success: false,
        error: error.response.data?.error || `Server error: ${error.response.status}`
      };
    }

    if (error.request) {
      // Request made but no response
      return {
        success: false,
        error: 'No response from email service. Please check your connection.'
      };
    }

    // Other errors
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

/**
 * Test N8N email service connection
 * @returns Promise with connection status
 */
export const testN8NConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  if (!N8N_WEBHOOK_URL) {
    return {
      connected: false,
      error: 'N8N Webhook URL not configured'
    };
  }

  try {
    // Send a test request (you might want to create a separate test endpoint in N8N)
    await axios.get(N8N_WEBHOOK_URL.replace('/webhook/', '/webhook-test/'), {
      timeout: 5000
    });
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: 'Cannot reach N8N service'
    };
  }
};
