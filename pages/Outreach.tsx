import React, { useEffect, useState } from 'react';
import { getLeads, updateLead, getCampaigns, getTemplates, getSettings } from '../services/storageService';
import { BusinessLead, Campaign, EmailTemplate, AppSettings } from '../types';
import { Mail, Send, Loader2, ChevronLeft, ChevronRight, MessageSquare, Check } from 'lucide-react';

export const Outreach: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    userName: '',
    companyName: '',
    dailyEmailLimit: 50,
    offerings: []
  });

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allLeads = await getLeads();
    const allCampaigns = await getCampaigns();
    const allTemplates = await getTemplates();
    const appSettings = await getSettings();
    
    setLeads(allLeads.filter(l => l.email));
    setCampaigns(allCampaigns);
    setTemplates(allTemplates);
    setSettings(appSettings);
  };

  const filteredLeads = selectedCampaignId === 'all' 
    ? leads 
    : leads.filter(l => l.campaignId === selectedCampaignId);

  const currentLead = filteredLeads[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredLeads.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSendEmail = async () => {
    if (!currentLead || !selectedTemplateId) {
      alert('Please select a template');
      return;
    }

    // Note: Email sending functionality has been moved to Email Campaigns page
    // Please use the Email Campaigns feature for sending emails
    alert('Please use the Email Campaigns page to send emails. This page is deprecated.');
  };

  const handleAutoSend = async () => {
    if (!selectedTemplateId) {
      alert('Please select a template');
      return;
    }

    // Note: Email sending functionality has been moved to Email Campaigns page
    alert('Please use the Email Campaigns page for automated email sending. This page is deprecated.');
  };

  const getPreviewContent = () => {
    if (!currentLead || !selectedTemplateId) return '';
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return '';

    let content = template.content;
    content = content.replace(/{{name}}/g, currentLead.name);
    content = content.replace(/{{business}}/g, currentLead.name);
    content = content.replace(/{{email}}/g, currentLead.email || '');
    content = content.replace(/{{phone}}/g, currentLead.phone || '');
    content = content.replace(/{{website}}/g, currentLead.website || '');
    content = content.replace(/{{address}}/g, currentLead.address);
    content = content.replace(/{{city}}/g, currentLead.city);
    content = content.replace(/{{category}}/g, currentLead.category);
    content = content.replace(/{{sender_name}}/g, settings.userName);
    content = content.replace(/{{company_name}}/g, settings.companyName);

    return content;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Deprecation Notice */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="bg-yellow-100 p-2 rounded-lg">
            <Mail className="text-yellow-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">This page is deprecated</h3>
            <p className="text-sm text-yellow-700">
              Please use the <strong>Email Campaigns</strong> page for all email outreach. 
              It has better templates, sequences, and analytics.
            </p>
            <a 
              href="/#/email-campaigns" 
              className="text-sm text-yellow-600 hover:text-yellow-700 underline mt-2 inline-block"
            >
              Go to Email Campaigns →
            </a>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Outreach (Legacy)</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveChannel('email')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              activeChannel === 'email'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            <Mail size={18} />
            Email
          </button>
          <button
            onClick={() => setActiveChannel('whatsapp')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              activeChannel === 'whatsapp'
                ? 'bg-green-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            <MessageSquare size={18} />
            WhatsApp
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Lead Selection */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Campaign</h3>
          
          <select
            value={selectedCampaignId}
            onChange={(e) => {
              setSelectedCampaignId(e.target.value);
              setCurrentIndex(0);
            }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Leads ({leads.length})</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({leads.filter(l => l.campaignId === campaign.id).length})
              </option>
            ))}
          </select>

          <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Template</h3>
          
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a template...</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-2">Progress</div>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {currentIndex + 1} / {filteredLeads.length}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / filteredLeads.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Sent Today</div>
            <div className="text-2xl font-bold text-blue-700">
              {sentCount} / {settings.dailyEmailLimit}
            </div>
          </div>
        </div>

        {/* Middle Panel - Lead Preview */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Lead</h3>
          
          {currentLead ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Business Name</div>
                <div className="font-medium text-slate-800">{currentLead.name}</div>
              </div>
              
              <div>
                <div className="text-sm text-slate-500 mb-1">Email</div>
                <div className="font-medium text-slate-800">{currentLead.email}</div>
              </div>
              
              <div>
                <div className="text-sm text-slate-500 mb-1">Phone</div>
                <div className="font-medium text-slate-800">{currentLead.phone || 'N/A'}</div>
              </div>
              
              <div>
                <div className="text-sm text-slate-500 mb-1">Category</div>
                <div className="font-medium text-slate-800">{currentLead.category}</div>
              </div>
              
              <div>
                <div className="text-sm text-slate-500 mb-1">Location</div>
                <div className="font-medium text-slate-800">{currentLead.address}</div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === filteredLeads.length - 1}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              No leads available
            </div>
          )}
        </div>

        {/* Right Panel - Message Preview & Actions */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Message Preview</h3>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {selectedTemplateId && currentLead ? (
              <div className="whitespace-pre-wrap text-sm text-slate-700">
                {getPreviewContent()}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                Select a template to preview
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSendEmail}
              disabled={!currentLead || !selectedTemplateId || sentCount >= settings.dailyEmailLimit}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={18} />
              Send to Current Lead
            </button>

            <button
              onClick={handleAutoSend}
              disabled={!selectedTemplateId || isAutoSending || sentCount >= settings.dailyEmailLimit}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isAutoSending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending... ({sendingProgress}%)
                </>
              ) : (
                <>
                  <Send size={18} />
                  Auto-Send to All
                </>
              )}
            </button>
          </div>

          {sentCount >= settings.dailyEmailLimit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              Daily email limit reached. Please try again tomorrow.
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Email Sent Successfully!</h3>
                <p className="text-sm text-slate-600">Sent to {successEmail}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
