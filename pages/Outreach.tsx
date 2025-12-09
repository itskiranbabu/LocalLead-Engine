import React, { useState, useEffect } from 'react';
import { getLeads, getSettings, updateLead, getTemplates, getCampaigns } from '../services/storageService';
import { quickPolishEmail, generateMarketingPitch } from '../services/geminiService';
import { BusinessLead, EmailTemplate, Campaign } from '../types';
import { Send, Wand2, RefreshCw, ChevronDown, Filter, Mail, Play, Loader2, CheckCircle, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'lucide-react';

type Channel = 'email' | 'whatsapp';

export const Outreach: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [offerings, setOfferings] = useState<string[]>([]);
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedOffering, setSelectedOffering] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<Channel>('email');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [polishing, setPolishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Bulk Sending State
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [selectedCampaignId, sentCount]); 

  const loadData = () => {
    const allLeads = getLeads();
    const allTemplates = getTemplates();
    const allCampaigns = getCampaigns();
    const settings = getSettings();
    
    setTemplates(allTemplates);
    setCampaigns(allCampaigns);
    setOfferings(settings.offerings || []);
    if (settings.offerings && settings.offerings.length > 0) {
        setSelectedOffering(settings.offerings[0]);
    }

    const actionable = allLeads.filter(l => {
        const matchesStatus = l.status === 'new' || l.status === 'contacted'; // Show recent ones too
        const matchesCampaign = selectedCampaignId === 'all' || l.campaignId === selectedCampaignId;
        // If channel is email, need email. If whatsapp, need phone.
        // But for queue list, we just show all matches and validate on selection
        return matchesStatus && matchesCampaign;
    });
    
    setLeads(actionable);
    
    if (actionable.length > 0 && !selectedLeadId) {
        setSelectedLeadId(actionable[0].id);
    }
    
    if (!selectedTemplateId && allTemplates.length > 0 && activeChannel === 'email') {
        applyTemplate(allTemplates[0]);
        setSelectedTemplateId(allTemplates[0].id);
    }
  };

  const currentLead = leads.find(l => l.id === selectedLeadId);

  // Switch templates or clear body when channel changes
  useEffect(() => {
      if (activeChannel === 'whatsapp') {
          setSubject('');
          if(!body.includes('WhatsApp')) setBody("Hi [Name], I saw your business and...");
      } else {
          // Revert to template default if empty
          if(templates.length > 0) applyTemplate(templates[0]);
      }
  }, [activeChannel]);

  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    const t = templates.find(temp => temp.id === tId);
    if (t) applyTemplate(t);
  };

  const handlePolish = async () => {
    if (!body) return;
    setPolishing(true);
    try {
        const polished = await quickPolishEmail(body);
        setBody(polished);
    } catch (e) {
        alert("Could not polish. Check API.");
    } finally {
        setPolishing(false);
    }
  };

  const handleAiDraft = async () => {
      if (!currentLead || !selectedOffering) {
          alert("Please select a lead and one of your offerings first (in Settings).");
          return;
      }
      setGenerating(true);
      try {
          const result = await generateMarketingPitch(currentLead, selectedOffering, activeChannel);
          setBody(result.body);
          if (result.subject && activeChannel === 'email') {
              setSubject(result.subject);
          }
      } catch (e) {
          alert("Failed to generate pitch.");
      } finally {
          setGenerating(false);
      }
  };

  const handleSendSingle = () => {
    if (!currentLead) return;
    
    if (activeChannel === 'whatsapp') {
        // Sanitize phone
        const raw = currentLead.phone || '';
        const phone = raw.replace(/\D/g, ''); // Remove all non-numeric
        if (phone.length < 10) {
            alert("Invalid phone number format for WhatsApp.");
            return;
        }
        
        // Encode message
        const text = encodeURIComponent(body);
        const url = `https://wa.me/${phone}?text=${text}`;
        
        window.open(url, '_blank');
        updateLead({ ...currentLead, status: 'contacted' });
        setSentCount(prev => prev + 1);

    } else {
        // Email simulation
        updateLead({ ...currentLead, status: 'contacted' });
        alert(`Email simulated sent to ${currentLead.email}!`);
        setSentCount(prev => prev + 1);
    }
  };

  const startAutoSend = async () => {
      // Only for email mode for now
    if (activeChannel === 'whatsapp') {
        alert("Bulk sending is not available for WhatsApp (requires manual approval).");
        return;
    }
    if (leads.length === 0) return;
    setIsAutoSending(true);
    setSendingProgress(0);

    const totalToSend = leads.length;
    
    // Simulate loop
    for (let i = 0; i < totalToSend; i++) {
        if (!isAutoSending && i > 0) break; 
        
        const lead = leads[i];
        if(!lead.email) continue;

        // Mock API latency
        await new Promise(r => setTimeout(r, 1500));
        
        updateLead({ ...lead, status: 'contacted' });
        setSendingProgress(((i + 1) / totalToSend) * 100);
    }

    setIsAutoSending(false);
    setSentCount(prev => prev + totalToSend);
    alert(`Campaign complete!`);
  };

  const settings = getSettings();
  
  // Replacements for preview
  const previewBody = body
    .replace('{{contact_name}}', currentLead?.name || 'there')
    .replace('{{business_name}}', currentLead?.name || 'Business')
    .replace('{{city}}', currentLead?.city || 'your city')
    .replace('{{your_name}}', settings.userName || 'Me')
    .replace('{{your_company}}', settings.companyName || 'My Company');

  const previewSubject = subject
    .replace('{{your_company}}', settings.companyName || 'My Company');

  return (
    <div className="p-8 h-full flex flex-col md:flex-row gap-8">
      {/* Left List */}
      <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700">Queue ({leads.length})</h3>
                {leads.length > 0 && activeChannel === 'email' && (
                    <button 
                        onClick={() => isAutoSending ? setIsAutoSending(false) : startAutoSend()}
                        disabled={isAutoSending}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                            isAutoSending ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {isAutoSending ? <Loader2 className="animate-spin" size={12}/> : <Play size={12} />}
                        {isAutoSending ? 'Sending...' : 'Auto-Send All'}
                    </button>
                )}
            </div>
            
            {isAutoSending && (
                <div className="mb-3">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${sendingProgress}%` }}></div>
                    </div>
                    <div className="text-[10px] text-slate-400 text-right mt-1">{Math.round(sendingProgress)}% complete</div>
                </div>
            )}
            
            <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select 
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="all">All Campaigns</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
            {leads.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
                    <CheckCircle className="mb-2 text-slate-300" size={32} />
                    <p>All queued leads contacted!</p>
                 </div>
            ) : (
                leads.map(lead => (
                    <div 
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedLeadId === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                    >
                        <div className="flex justify-between">
                            <div className="font-bold text-slate-800">{lead.name}</div>
                            <div className="flex gap-1">
                                {lead.email && <Mail size={12} className="text-slate-400" />}
                                {lead.phone && <MessageCircle size={12} className="text-slate-400" />}
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 mb-1">{lead.city} • {lead.category}</div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Right Composer */}
      {leads.length > 0 && currentLead ? (
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
             
             {/* Channel Tabs */}
             <div className="flex border-b border-slate-200">
                 <button 
                    onClick={() => setActiveChannel('email')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeChannel === 'email' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                     <Mail size={16} /> Email
                 </button>
                 <button 
                    onClick={() => setActiveChannel('whatsapp')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeChannel === 'whatsapp' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                     <MessageCircle size={16} /> WhatsApp
                 </button>
             </div>

             <div className="p-6 border-b border-slate-100 space-y-4">
                
                {/* Header Info */}
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">To:</span>
                        <span className="ml-2 text-slate-800 font-medium">
                            {activeChannel === 'email' ? (currentLead.email || 'No Email Found') : (currentLead.phone || 'No Phone Found')}
                        </span>
                    </div>
                    
                    {activeChannel === 'email' && (
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-400">Template:</span>
                             <div className="relative">
                                <select 
                                    value={selectedTemplateId} 
                                    onChange={handleTemplateChange}
                                    className="appearance-none bg-slate-50 border border-slate-200 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    {templates.length === 0 && <option>No templates</option>}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                             </div>
                        </div>
                    )}
                </div>

                {/* Offering Selection & AI Generation */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase ml-2">I'm selling:</span>
                    <select
                        value={selectedOffering}
                        onChange={e => setSelectedOffering(e.target.value)}
                        className="bg-white border border-slate-200 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {offerings.length === 0 && <option value="">No services defined (Go to Settings)</option>}
                        {offerings.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    
                    <button
                        onClick={handleAiDraft}
                        disabled={generating || !selectedOffering}
                        className="ml-auto bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-purple-700 disabled:opacity-50"
                    >
                        {generating ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12} />}
                        AI Generate Pitch
                    </button>
                </div>
                
                {activeChannel === 'email' && (
                    <input 
                        type="text" 
                        placeholder="Subject Line"
                        className="w-full text-lg font-bold border-none focus:ring-0 px-0 placeholder-slate-300"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                    />
                )}
             </div>
             
             {/* Editor Area */}
             <div className="flex-1 p-6 flex flex-col gap-4">
                <div className="flex-1 relative group">
                    <textarea
                        className="w-full h-full resize-none border-none focus:ring-0 text-slate-600 leading-relaxed outline-none font-mono text-sm"
                        placeholder={activeChannel === 'email' ? "Write your email here..." : "Type WhatsApp message..."}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />
                    {activeChannel === 'email' && (
                        <button 
                            onClick={handlePolish}
                            disabled={polishing}
                            className="absolute bottom-4 right-4 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-purple-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                            {polishing ? <RefreshCw className="animate-spin" size={12} /> : <Wand2 size={12} />}
                            AI Polish
                        </button>
                    )}
                </div>
                
                {/* Preview Box */}
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500 border border-slate-100">
                    <p className="font-bold text-xs uppercase mb-2 text-slate-400 border-b border-slate-200 pb-1">
                        Preview ({activeChannel}): 
                        {activeChannel === 'email' && <span className="text-slate-700 normal-case ml-2">{previewSubject}</span>}
                    </p>
                    <div className="whitespace-pre-wrap font-sans text-slate-800">{previewBody}</div>
                </div>

                {/* Send Button */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button 
                        onClick={handleSendSingle}
                        disabled={isAutoSending || (activeChannel === 'whatsapp' && !currentLead.phone) || (activeChannel === 'email' && !currentLead.email)}
                        className={`${activeChannel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {activeChannel === 'whatsapp' ? <ExternalLink size={18} /> : <Send size={18} />}
                        {activeChannel === 'whatsapp' ? 'Open WhatsApp' : 'Send Email'}
                    </button>
                </div>
             </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400">
            <div className="text-center">
                <Mail size={48} className="mx-auto mb-4 opacity-20" />
                <p>Select a campaign and lead to start writing.</p>
            </div>
        </div>
      )}
    </div>
  );
};