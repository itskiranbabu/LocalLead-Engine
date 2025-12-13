import React, { useEffect, useState } from 'react';
import { getLeads, updateLead, getCampaigns, deleteLead, getSettings } from '../services/storageService';
import { enrichLeadData, generateContentCalendar, performDeepResearch } from '../services/geminiService';
import { BusinessLead, Campaign } from '../types';
import { Download, Search, Sparkles, Loader2, Mail, Phone, Trash2, CalendarDays, X, Microscope, Globe, Zap, Edit, CheckCircle, MessageCircle } from 'lucide-react';
import { emailEnrichmentService } from '../services/emailEnrichmentService';
import { freeEnrichmentService } from '../services/freeEnrichmentService';
import { supabase } from '../lib/supabase';

export const LeadsManager: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [enriching, setEnriching] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [enrichmentSuccess, setEnrichmentSuccess] = useState<{ [key: string]: boolean }>({});
  
  // Enrichment Results Modal
  const [enrichmentResults, setEnrichmentResults] = useState<{
    leadId: string;
    leadName: string;
    primaryEmail: string;
    possibleEmails: string[];
    confidence: number;
  } | null>(null);
  
  // Content Calendar State
  const [calendarLead, setCalendarLead] = useState<BusinessLead | null>(null);
  const [calendarContent, setCalendarContent] = useState<string>('');
  const [generatingCalendar, setGeneratingCalendar] = useState(false);

  // Deep Research State
  const [researchLead, setResearchLead] = useState<BusinessLead | null>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [researching, setResearching] = useState(false);

  // Edit Lead State
  const [editingLead, setEditingLead] = useState<BusinessLead | null>(null);
  const [editForm, setEditForm] = useState<Partial<BusinessLead>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLeads(await getLeads());
    setCampaigns(await getCampaigns());
  };

  const handleEnrich = async (lead: BusinessLead) => {
    setEnriching(lead.id);
    try {
      // Use FREE enrichment service (no API keys needed!)
      const result = await freeEnrichmentService.enrichLead(lead);
      
      if (result.success && result.enrichedData) {
        // Update lead with enriched data
        const updated = { 
          ...lead, 
          ...result.enrichedData
        };
        await updateLead(updated);
        await loadData();
        
        // Show enrichment results modal
        setEnrichmentResults({
          leadId: lead.id,
          leadName: lead.name,
          primaryEmail: result.enrichedData.email || 'not_found',
          possibleEmails: result.possibleEmails || [],
          confidence: result.enrichedData.metadata?.emailConfidence || 75
        });
        
        setEnrichmentSuccess({ ...enrichmentSuccess, [lead.id]: true });
        setTimeout(() => {
          setEnrichmentSuccess({ ...enrichmentSuccess, [lead.id]: false });
        }, 3000);
      } else {
        alert(result.error || "Failed to enrich lead");
      }
    } catch (err: any) {
      alert(err.message || "Failed to enrich lead");
    } finally {
      setEnriching(null);
    }
  };

  const handleSelectEmail = async (email: string) => {
    if (!enrichmentResults) return;
    
    const lead = leads.find(l => l.id === enrichmentResults.leadId);
    if (!lead) return;
    
    const updated = { ...lead, email };
    await updateLead(updated);
    await loadData();
    setEnrichmentResults(null);
  };

  const handleDeepResearch = async (lead: BusinessLead) => {
      setResearchLead(lead);
      setResearching(true);
      setResearchResult(null);

      if (lead.deepResearch) {
          setResearchResult(lead.deepResearch);
          setResearching(false);
          return;
      }

      try {
          const result = await performDeepResearch(lead);
          setResearchResult(result);
          const updated = { 
              ...lead, 
              deepResearch: { ...result, lastRun: new Date().toISOString() } 
          };
          await updateLead(updated);
          await loadData();
      } catch (e) {
          setResearchResult({ error: "Failed to perform research." });
      } finally {
          setResearching(false);
      }
  }

  const handleGenerateCalendar = async (lead: BusinessLead) => {
    setCalendarLead(lead);
    setGeneratingCalendar(true);
    setCalendarContent('');
    try {
        const content = await generateContentCalendar(lead);
        setCalendarContent(content);
    } catch (e) {
        setCalendarContent("Failed to generate content calendar. Please try again.");
    } finally {
        setGeneratingCalendar(false);
    }
  };

  const handleAssignCampaign = async (lead: BusinessLead, campaignId: string) => {
    const updated = { ...lead, campaignId: campaignId === 'none' ? undefined : campaignId };
    await updateLead(updated);
    await loadData();
  };

  const handleStatusChange = async (lead: BusinessLead, status: BusinessLead['status']) => {
    const updated = { ...lead, status };
    await updateLead(updated);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      await deleteLead(id);
      await loadData();
    }
  };

  const handleEditLead = (lead: BusinessLead) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website || '',
      address: lead.address,
      category: lead.category,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    
    const updated = { ...editingLead, ...editForm };
    await updateLead(updated);
    await loadData();
    setEditingLead(null);
    setEditForm({});
  };

  const handleWhatsAppMessage = (lead: BusinessLead) => {
    if (!lead.phone) {
      alert('No phone number available for this lead');
      return;
    }

    // Get user settings for personalization
    const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
    const userName = settings.userName || 'Your Name';
    const companyName = settings.companyName || 'Your Company';

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');
    
    // Create WhatsApp message template
    const message = `Hi ${lead.name} team! 👋

I came across your business and was impressed by your ${lead.rating ? lead.rating + '⭐ rating' : 'presence'} in ${lead.city}.

I'm ${userName} from ${companyName}, and I help businesses like yours grow through digital marketing.

Would you be interested in a quick chat about how we can help you attract more customers?

Best regards,
${userName}
${companyName}

Learn more: https://tr.ee/itskiranbabu`;

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Website', 'Address', 'City', 'Category', 'Status', 'Rating', 'Reviews'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email || '',
      lead.phone || '',
      lead.website || '',
      lead.address,
      lead.city,
      lead.category,
      lead.status,
      lead.rating || '',
      lead.reviews || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLeads = leads.filter(lead => {
    const matchesCampaign = filterCampaign === 'all' || lead.campaignId === filterCampaign;
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesCampaign && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Leads Manager</h2>
        <button
          onClick={exportToCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Campaign</label>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="converted">Converted</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{lead.name}</div>
                    {lead.website && (
                      <a href={lead.website} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Globe size={12} />
                        Website
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.phone && (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Phone size={14} />
                        {lead.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.email ? (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-green-600" />
                        <span className="text-sm text-slate-700">{lead.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X size={14} className="text-red-500" />
                        <span className="text-xs text-slate-400">Not enriched</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <div>{lead.city}</div>
                    <div className="text-xs text-slate-400">{lead.address}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                      {lead.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead, e.target.value as BusinessLead['status'])}
                      className="text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="replied">Replied</option>
                      <option value="converted">Converted</option>
                      <option value="ignored">Ignored</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.campaignId || 'none'}
                      onChange={(e) => handleAssignCampaign(lead, e.target.value)}
                      className="text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      {campaigns.map(campaign => (
                        <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEnrich(lead)}
                        disabled={enriching === lead.id}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded hover:bg-purple-50 transition-colors disabled:opacity-50 relative"
                        title="Enrich with FREE email patterns"
                      >
                        {enriching === lead.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : enrichmentSuccess[lead.id] ? (
                          <CheckCircle size={18} className="text-green-600" />
                        ) : (
                          <Sparkles size={18} />
                        )}
                      </button>
                      
                      {/* WhatsApp button - only show if no email */}
                      {!lead.email && lead.phone && (
                        <button
                          onClick={() => handleWhatsAppMessage(lead)}
                          className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Send WhatsApp Message"
                        >
                          <MessageCircle size={18} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeepResearch(lead)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Deep Research"
                      >
                        <Microscope size={18} />
                      </button>
                      <button
                        onClick={() => handleGenerateCalendar(lead)}
                        className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors"
                        title="Content Calendar"
                      >
                        <CalendarDays size={18} />
                      </button>
                      <button
                        onClick={() => handleEditLead(lead)}
                        className="text-slate-600 hover:text-slate-700 p-1 rounded hover:bg-slate-50 transition-colors"
                        title="Edit Lead"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrichment Results Modal */}
      {enrichmentResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">✨ Email Enrichment Results</h3>
                  <p className="text-purple-100">{enrichmentResults.leadName}</p>
                </div>
                <button
                  onClick={() => setEnrichmentResults(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800">Primary Email (Auto-selected)</h4>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {enrichmentResults.confidence}% Confidence
                  </span>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="text-green-600" size={24} />
                      <span className="text-lg font-medium text-slate-800">{enrichmentResults.primaryEmail}</span>
                    </div>
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              {enrichmentResults.possibleEmails.length > 1 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Alternative Email Patterns</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Click any email below to use it instead of the primary suggestion
                  </p>
                  <div className="space-y-2">
                    {enrichmentResults.possibleEmails.slice(1).map((email, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectEmail(email)}
                        className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg p-3 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="text-slate-400 group-hover:text-blue-600" size={20} />
                            <span className="text-slate-700 group-hover:text-blue-700">{email}</span>
                          </div>
                          <span className="text-xs text-slate-500 group-hover:text-blue-600">
                            {Math.max(50, enrichmentResults.confidence - (idx + 1) * 10)}% confidence
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <Zap className="text-blue-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">💡 Pro Tip</p>
                    <p>These emails are generated using common business patterns. Try all suggestions to find the correct one!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Calendar Modal */}
      {calendarLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">📅 Content Calendar</h3>
                  <p className="text-green-100">{calendarLead.name}</p>
                </div>
                <button
                  onClick={() => setCalendarLead(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {generatingCalendar ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={48} className="animate-spin text-green-600 mb-4" />
                  <p className="text-slate-600">Generating personalized content calendar...</p>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700">{calendarContent}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deep Research Modal */}
      {researchLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">🔬 Deep Research</h3>
                  <p className="text-blue-100">{researchLead.name}</p>
                </div>
                <button
                  onClick={() => setResearchLead(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {researching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                  <p className="text-slate-600">Performing deep research...</p>
                </div>
              ) : researchResult ? (
                <div className="space-y-6">
                  {researchResult.error ? (
                    <div className="text-red-600">{researchResult.error}</div>
                  ) : (
                    <>
                      {researchResult.summary && (
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Summary</h4>
                          <p className="text-slate-700">{researchResult.summary}</p>
                        </div>
                      )}
                      {researchResult.iceBreakers && researchResult.iceBreakers.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Ice Breakers</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {researchResult.iceBreakers.map((ib: string, i: number) => (
                              <li key={i} className="text-slate-700">{ib}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {researchResult.news && researchResult.news.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Recent News</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {researchResult.news.map((n: string, i: number) => (
                              <li key={i} className="text-slate-700">{n}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">✏️ Edit Lead</h3>
                  <p className="text-slate-200">{editingLead.name}</p>
                </div>
                <button
                  onClick={() => setEditingLead(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@business.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                <input
                  type="url"
                  value={editForm.website || ''}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://business.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <input
                  type="text"
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingLead(null)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
