import React from 'react';
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react';

interface DemoModeBannerProps {
  onSetupClick?: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onSetupClick }) => {
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
              onClick={onSetupClick}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Zap size={16} />
              Enable Real Email Sending
              <ArrowRight size={16} />
            </button>
            <a
              href="/#/settings"
              className="text-yellow-700 hover:text-yellow-800 text-sm font-medium underline"
            >
              Go to Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
