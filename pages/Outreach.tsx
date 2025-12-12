import React, { useEffect, useState } from 'react';
import { getLeads, updateLead, getCampaigns, getTemplates, getSettings } from '../services/storageService';
import { BusinessLead, Campaign, EmailTemplate, AppSettings } from '../types';
import { Mail, Send, Loader2, ChevronLeft, ChevronRight, MessageSquare, Check } from 'lucide-react';
import { sendEmailCampaign } from '../services/emailService';

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
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
    setLeads(await getLeads());
    setCampaigns(await getCampaigns());
    setTemplates(await getTemplates());
  };

  const filteredLeads = leads.filter(l => {
    if (selectedCampaignId === 'all') return true;
    return l.campaignId === selectedCampaignId;
  });

  const currentLead = filteredLeads[currentIndex];

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const replaceVariables = (text: string, lead: BusinessLead) => {
    if (!text) return '';
    return text
      .replace(/\{\{business_name\}\}/g, lead.name)
      .replace(/\{\{city\}\}/g, lead.city)
      .replace(/\{\{category\}\}/g, lead.category)
      .replace(/\{\{your_name\}\}/g, settings.userName || 'Your Name')
      .replace(/\{\{company_name\}\}/g, settings.companyName || 'Your Company')
      .replace(/\{\{offerings\}\}/g, settings.offerings?.join(', ') || 'our services');
  };

  const processedSubject = currentLead && selectedTemplate 
    ? replaceVariables(selectedTemplate.subject, currentLead) 
    : '';

  const processedBody = currentLead && selectedTemplate 
    ? replaceVariables(selectedTemplate.body, currentLead) 
    : '';

  const handleNext = () => {
    if (currentIndex < filteredLeads.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSendOne = async () => {
    if (!currentLead) return;

    if (activeChannel === 'whatsapp') {
        // WhatsApp Logic
        if (!currentLead.phone) {
            alert('No phone number available for this lead.');
            return;
        }

        let phone = currentLead.phone.replace(/\D/g, '');
        
        if (phone.length < 10) {
            alert("Invalid phone number format for WhatsApp. Need at least 10 digits.");
            return;
        }
        
        // Use api.whatsapp.com
        const text = encodeURIComponent(processedBody);
        const url = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
        
        window.open(url, '_blank');
        
        await updateLead({ ...currentLead, status: 'contacted' });
        setSentCount(prev => prev + 1);

    } else {
        // Real Email Sending
        try {
          if(!processedBody.trim()) {
            alert("Please write a message body.");
            return;
          }

          await sendEmailCampaign(
            [currentLead.id],
            selectedTemplateId || undefined, 
            selectedCampaignId === 'all' ? undefined : selectedCampaignId,
            { customSubject: processedSubject, customBody: processedBody }
          );

          await updateLead({ ...currentLead, status: 'contacted' });
          
          // Show success modal
          setSuccessEmail(currentLead.email || '');
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 3000);
          
          setSentCount(prev => prev + 1);
        } catch (error: any) {
          console.error("Email send failed:", error);
          alert("Failed to send email. Check console/backend logs.");
        }
    }
  };

  const startAutoSend = async () => {
    if (activeChannel === 'whatsapp') {
        alert("Bulk sending is not available for WhatsApp (requires manual approval).");
        return;
    }
    if (leads.length === 0) return;
    setIsAutoSending(true);
    setSendingProgress(0);

    const totalToSend = leads.length;
    const batchSize = 5; 
    let sent = 0;

    for (let i = 0; i < totalToSend; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (lead) => {
          if (lead.email) {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
              const subject = replaceVariables(template.subject, lead);
              const body = replaceVariables(template.body, lead);
              
              try {
                await sendEmailCampaign(
                  [lead.id],
                  selectedTemplateId || undefined,
                  selectedCampaignId === 'all' ? undefined : selectedCampaignId,
                  { customSubject: subject, customBody: body }
                );
                await updateLead({ ...lead, status: 'contacted' });
                sent++;
              } catch (error) {
                console.error(`Failed to send to ${lead.email}:`, error);
              }
            }
          }
        })
      );
      setSendingProgress(Math.round((sent / totalToSend) * 100));
      await new Promise(r => setTimeout(r, 2000)); // Rate limiting
    }

    setIsAutoSending(false);
    setSentCount(sent);
    alert(`Bulk send complete! Sent ${sent} emails.`);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Email Sent Successfully!</h3>
              <p className="text-slate-600 mb-1">Your email has been delivered to:</p>
              <p className="text-blue-600 font-semibold">{successEmail}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Outreach</h2>
          <p className="text-slate-500">Send personalized messages to your leads</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setActiveChannel('email')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeChannel === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Mail size={16} />
              Email
            </button>
            <button
              onClick={() => setActiveChannel('whatsapp')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeChannel === 'whatsapp'
                  ? 'bg-green-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare size={16} />
              WhatsApp
            </button>
          </div>
          <div className="text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
            Sent Today: <span className="font-bold text-slate-800">{sentCount}</span> / {settings.dailyEmailLimit}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Panel: Lead Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Current Lead</h3>
          {currentLead ? (
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Business Name</p>
                <p className="text-slate-800 font-bold text-lg">{currentLead.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Category</p>
                <p className="text-slate-700">{currentLead.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Location</p>
                <p className="text-slate-700">{currentLead.city}</p>
              </div>
              {currentLead.email && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
                  <p className="text-blue-600">{currentLead.email}</p>
                </div>
              )}
              {currentLead.phone && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Phone</p>
                  <p className="text-slate-700">{currentLead.phone}</p>
                </div>
              )}
              {currentLead.website && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Website</p>
                  <a href={currentLead.website} target="_blank" className="text-blue-500 hover:underline text-sm">
                    {new URL(currentLead.website).hostname}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No leads available</p>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-slate-600">
              {currentIndex + 1} / {filteredLeads.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex === filteredLeads.length - 1}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Middle Panel: Message Composer */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              {activeChannel === 'email' ? 'Email Message' : 'WhatsApp Message'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSendOne}
                disabled={!currentLead || isAutoSending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
                Send to Current
              </button>
              {activeChannel === 'email' && (
                <button
                  onClick={startAutoSend}
                  disabled={isAutoSending || filteredLeads.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAutoSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isAutoSending ? `Sending... ${sendingProgress}%` : 'Bulk Send All'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 flex-1 flex flex-col">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Campaign</label>
              <select
                value={selectedCampaignId}
                onChange={(e) => {
                  setSelectedCampaignId(e.target.value);
                  setCurrentIndex(0);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {activeChannel === 'email' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={processedSubject}
                  readOnly
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50"
                  placeholder="Select a template to preview subject"
                />
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-slate-700 mb-2">Message Body</label>
              <textarea
                value={processedBody}
                readOnly
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 resize-none"
                placeholder="Select a template to preview message"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
