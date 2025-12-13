import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, CheckCircle, XCircle, Settings, Loader2 } from 'lucide-react';
import { emailSendingService } from '../services/emailSendingService';
import { useNavigate } from 'react-router-dom';

export const N8NStatusBanner: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<{
    configured: boolean;
    webhookUrl: string | null;
    ready: boolean;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const n8nStatus = await emailSendingService.getN8NStatus();
    setStatus(n8nStatus);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    const result = await emailSendingService.testN8NConnection();
    setTestResult(result);
    setTesting(false);
    
    // Refresh status after test
    await checkStatus();
  };

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  if (!status) {
    return null;
  }

  // Production Mode (N8N Configured)
  if (status.configured && status.ready) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-green-800">Production Mode Active</h3>
              <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-medium rounded">
                Real Email Sending
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-green-700 mb-3">
              <p className="font-medium">✅ N8N Connected:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Emails will be sent via your Gmail</li>
                <li>Real tracking (opens & clicks)</li>
                <li>Actual responses from leads</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Test Connection
                  </>
                )}
              </button>
              <button
                onClick={handleGoToSettings}
                className="text-green-700 hover:text-green-800 text-sm font-medium underline flex items-center gap-1"
              >
                <Settings size={14} />
                Settings
              </button>
            </div>

            {testResult && (
              <div className={`mt-3 p-3 rounded-lg ${
                testResult.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span className="text-sm font-medium">{testResult.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Demo Mode (N8N Not Configured)
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="bg-yellow-100 p-2 rounded-lg">
          <AlertTriangle className="text-yellow-600" size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-yellow-800">Demo Mode Active</h3>
            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
              Testing Only
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-yellow-700 mb-3">
            <p className="font-medium">✅ What Works:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Campaign creation and scheduling</li>
              <li>Email preview with personalization</li>
              <li>Analytics dashboard</li>
            </ul>
            
            <p className="font-medium mt-3">❌ What Doesn't Work:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Emails are NOT actually sent</li>
              <li>No real tracking (opens/clicks)</li>
              <li>No actual responses from leads</li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToSettings}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Zap size={16} />
              Enable Real Email Sending
            </button>
            <a
              href="https://github.com/itskiranbabu/LocalLead-Engine/blob/main/docs/N8N_INTEGRATION_ANALYSIS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-700 hover:text-yellow-800 text-sm font-medium underline"
            >
              Setup Guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
