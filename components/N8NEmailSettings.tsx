import React, { useState, useEffect } from 'react';
import { emailSendingService } from '../services/emailSendingService';
import { Zap, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

export const N8NEmailSettings: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const config = emailSendingService.getConfig();
    setWebhookUrl(config.webhookUrl);
    setEnabled(config.enabled);
  };

  const handleTestConnection = async () => {
    if (!webhookUrl) {
      setTestResult({
        success: false,
        message: 'Please enter a webhook URL first',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await emailSendingService.testConnection(webhookUrl);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);

    emailSendingService.saveConfig({
      webhookUrl,
      enabled,
    });

    setTimeout(() => {
      setSaving(false);
      alert('N8N email settings saved successfully!');
    }, 500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-lg">
          <Zap className="text-purple-600" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">N8N Email Integration</h3>
          <p className="text-sm text-slate-600">Send emails via N8N workflow automation</p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
          />
          <div>
            <span className="font-medium text-slate-800">Enable N8N Email Sending</span>
            <p className="text-sm text-slate-600">
              {enabled ? 'Emails will be sent via N8N workflow' : 'Email sending is disabled (demo mode)'}
            </p>
          </div>
        </label>
      </div>

      {/* Webhook URL */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          N8N Webhook URL
        </label>
        <input
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-n8n-instance.com/webhook/locallead-send-email"
          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter your N8N webhook URL from the "LocalLead Email Campaign Sender" workflow
        </p>
      </div>

      {/* Test Connection */}
      <div className="mb-6">
        <button
          onClick={handleTestConnection}
          disabled={testing || !webhookUrl}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {testing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Zap size={18} />
              Test Connection
            </>
          )}
        </button>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {testResult.success ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <XCircle className="text-red-600" size={20} />
            )}
            <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
              {testResult.message}
            </span>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>

      {/* Setup Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <ExternalLink size={16} />
          Setup Instructions
        </h4>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
          <li>Import the N8N workflow from <code className="bg-blue-100 px-1 rounded">n8n-workflows/email-campaign-sender.json</code></li>
          <li>Configure Gmail OAuth2 credentials in N8N</li>
          <li>Activate the workflow in N8N</li>
          <li>Copy the webhook URL from the first node</li>
          <li>Paste the URL above and test connection</li>
          <li>Enable email sending and save settings</li>
        </ol>
        <a
          href="https://github.com/itskiranbabu/LocalLead-Engine/blob/main/docs/N8N_EMAIL_SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 underline mt-3 inline-block"
        >
          View detailed setup guide →
        </a>
      </div>

      {/* Status Indicator */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Email Sending Status:</span>
          <div className="flex items-center gap-2">
            {enabled && webhookUrl ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-sm text-slate-600 font-medium">Inactive (Demo Mode)</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
