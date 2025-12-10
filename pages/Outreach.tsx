import React, { useState, useEffect, useCallback } from 'react';
import { getLeads, getSettings, updateLead, getTemplates, getCampaigns } from '../services/storageService';
import { quickPolishEmail, generateMarketingPitch } from '../services/geminiService';
import { sendEmailCampaign } from '../services/backendService';
import { BusinessLead, EmailTemplate, Campaign } from '../types';
import { Send, Wand2, RefreshCw, ChevronDown, Filter, Mail, Play, Loader2, CheckCircle, MessageCircle, ExternalLink, Sparkles, X, Save } from 'lucide-react';

type Channel = 'email' | 'whatsapp';

// Helper to replace variables securely
const replaceVariables = (text: string, lead: BusinessLead, settings: any) => {
    const contactName = lead.enrichmentData?.contactName || lead.name;
    return text
    .replace(/{{contact_name}}/g, contactName)
    .replace(/{{business_name}}/g, lead.name || 'Business')
    .replace(/{{city}}/g, lead.city || 'your city')
    .replace(/{{category}}/g, lead.category || 'your niche')
    .replace(/{{your_name}}/g, settings.userName || 'Me')
    .replace(/{{your_company}}/g, settings.companyName || 'Content Spark');
};

export const Outreach: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [offerings, setOfferings] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedOffering, setSelectedOffering] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<Channel>('email');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [polishing, setPolishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Per-Lead Drafts
  const [drafts, setDrafts] = useState<Record<string, {subject: string, body: string, channel: Channel}>>({});

  // Bulk Sending State
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [selectedCampaignId, sentCount]); 

  const loadData = async () => {
    const allLeads = await getLeads();
    const allTemplates = await getTemplates();
    const allCampaigns = await getCampaigns();
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
    
    setTemplates(allTemplates);
    setCampaigns(allCampaigns);
    setOfferings(loadedSettings.offerings || []);
    if (loadedSettings.offerings && loadedSettings.offerings.length > 0) {
        setSelectedOffering(loadedSettings.offerings[0]);
    }

    const actionable = allLeads.filter(l => {
        const matchesStatus = l.status === 'new' || l.status === 'contacted'; // Show recent ones too
        const matchesCampaign = selectedCampaignId === 'all' || l.campaignId === selectedCampaignId;
        return matchesStatus && matchesCampaign;
    });
    
    setLeads(actionable);
    
    if (actionable.length > 0 && !selectedLeadId) {
        setSelectedLeadId(actionable[0].id);
    }
    
    if (!selectedTemplateId && allTemplates.length > 0 && activeChannel === 'email') {
        setSelectedTemplateId(allTemplates[0].id);
    }
  };

  const currentLead = leads.find(l => l.id === selectedLeadId);

  // Load draft or template when switching leads or channels
  useEffect(() => {
      if (!currentLead) return;
      
      const key = `${currentLead.id}-${activeChannel}`;
      if (drafts[key]) {
          // Restore draft
          setSubject(drafts[key].subject);
          setBody(drafts[key].body);
      } else {
          // Apply Default
          if (activeChannel === 'whatsapp') {
            setSubject('');
            setBody("Hi {{contact_name}},\n\nThis is {{your_name}} from {{your_company}}. We help businesses in {{city}} grow using AI.\n\nAre you open to a quick chat?");
          } else {
              // Email
              const tmpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
              if (tmpl) {
                  setSubject(tmpl.subject);
                  setBody(tmpl.body);
              } else {
                  setSubject("Partnership Opportunity");
                  setBody("Hi {{contact_name}}...");
              }
          }
      }
  }, [selectedLeadId, activeChannel, currentLead, templates, selectedTemplateId]);

  // Save Draft Debounced
  useEffect(() => {
      if (!currentLead) return;
      const timer = setTimeout(() => {
        const key = `${currentLead.id}-${activeChannel}`;
        setDrafts(prev => ({
            ...prev,
            [key]: { subject, body, channel: activeChannel }
        }));
      }, 500);
      return () => clearTimeout(timer);
  }, [subject, body, activeChannel, currentLead]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    // Explicitly overwrite current body when template is manually changed
    const t = templates.find(temp => temp.id === tId);
    if (t) {
        setSubject(t.subject);
        setBody(t.body);
    }
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

  const handleRemoveFromQueue = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if(currentLead) {
          // Just unassign campaign or set status to ignored to hide from here?
          // Let's set status to ignored for now, or just hide locally?
          // To truly "manage", let's set status to 'ignored' so it drops off this list
          await updateLead({ ...currentLead, status: 'ignored' });
          setLeads(prev => prev.filter(l => l.id !== currentLead.id));
          if(leads.length > 1) setSelectedLeadId(leads[0].id === currentLead.id ? leads[1].id : leads[0].id);
          else setSelectedLeadId('');
      }
  }

  const handleSendSingle = async () => {
    if (!currentLead) return;
    
    // Process variables NOW
    const processedBody = replaceVariables(body, currentLead, settings);
    const processedSubject = replaceVariables(subject, currentLead, settings);

    if (activeChannel === 'whatsapp') {
        // Sanitize phone
        const raw = currentLead.phone || '';
        let phone = raw.replace(/\D/g, ''); // Remove all non-numeric

        // Logic for Indian Numbers
        if (phone.length === 10) {
          phone = '91' + phone;
        } else if (phone.length > 10 && phone.startsWith('0')) {
          phone = '91' + phone.substring(1);
        }

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
          alert(`Email sent to ${currentLead.email}!`);
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
    
    try {
      for (let i = 0; i < totalToSend; i += batchSize) {
          if (!isAutoSending && i > 0) break; 
          
          const batch = leads.slice(i, i + batchSize);
          const validBatch = batch.filter(l => !!l.email);
          const ids = validBatch.map(l => l.id);

          if (ids.length > 0) {
            // Note: Auto-send currently uses the RAW template (with placeholders) because
            // generating custom body for everyone client-side is hard.
            // The backend handles the replacement for bulk sends using the templateId.
            // If the user modified the text in the editor, that only applies to the SINGLE currently selected lead.
            // For bulk, we fall back to the selected Template ID.
            
            await sendEmailCampaign(
              ids, 
              selectedTemplateId || undefined,
              selectedCampaignId === 'all' ? undefined : selectedCampaignId,
              undefined // No overrides for bulk, use template
            );
            
            for(const lead of validBatch) {
              await updateLead({ ...lead, status: 'contacted' });
            }
          }

          setSendingProgress(Math.min(((i + batchSize) / totalToSend) * 100, 100));
          await new Promise(r => setTimeout(r, 1000));
      }
      alert(`Campaign complete!`);
    } catch (err) {
      console.error(err);
      alert("Campaign paused due to error.");
    } finally {
      setIsAutoSending(false);
      setSentCount(prev => prev + totalToSend);
    }
  };

  // Preview Calculation
  const previewBody = replaceVariables(body, currentLead || {} as any, settings);
  const previewSubject = replaceVariables(subject, currentLead || {} as any, settings);

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
             {/* Header */}
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
                        {/* Draft Status Indicator */}
                        {drafts[`${currentLead.id}-${activeChannel}`] && (
                            <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Draft Saved</span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
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
                        <button 
                            onClick={handleRemoveFromQueue}
                            className="text-slate-400 hover:text-red-500 text-xs font-medium flex items-center gap-1"
                            title="Remove from queue (mark as ignored)"
                        >
                            <X size={14} /> Remove
                        </button>
                    </div>
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
                        disabled={isAutoSending || (activeChannel === 'whatsapp' && !currentLead.phone)}
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