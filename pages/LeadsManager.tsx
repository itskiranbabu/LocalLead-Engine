import React, { useEffect, useState } from 'react';
import { getLeads, updateLead, getCampaigns, deleteLead, getSettings } from '../services/storageService';
import { enrichLeadData, generateContentCalendar, performDeepResearch } from '../services/geminiService';
import { BusinessLead, Campaign } from '../types';
import { Download, Search, Sparkles, Loader2, Mail, Phone, Trash2, CalendarDays, X, Microscope, Globe, Zap, Edit } from 'lucide-react';
import { emailEnrichmentService } from '../services/emailEnrichmentService';
import { supabase } from '../lib/supabase';

export const LeadsManager: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [enriching, setEnriching] = useState<string | null>(null); // ID of lead being enriched
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
    const [enrichmentSuccess, setEnrichmentSuccess] = useState<{ [key: string]: boolean }>({});
  
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
      const enrichmentData = await enrichLeadData(lead);
      const updated = { ...lead, ...enrichmentData };
      await updateLead(updated);
      await loadData(); // Refresh UI
    } catch (err) {
      alert("Failed to enrich using AI. Check API Configuration.");
    } finally {
      setEnriching(null);
    }
  };

  const handleDeepResearch = async (lead: BusinessLead) => {
      setResearchLead(lead);
      setResearching(true);
      setResearchResult(null);

      // Check if already researched
      if (lead.deepResearch) {
          setResearchResult(lead.deepResearch);
          setResearching(false);
          return;
      }

      try {
          const result = await performDeepResearch(lead);
          setResearchResult(result);
          // Save to lead
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

  const handleStatusChange = async (lead: BusinessLead, newStatus: any) => {
    const updated = { ...lead, status: newStatus };
    await updateLead(updated);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      await deleteLead(id);
      await loadData();
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Website', 'Address', 'City', 'Category', 'Status', 'Campaign'];
    const rows = leads.map(l => [
      l.name,
      l.email || '',
      l.phone || '',
      l.website || '',
      l.address || '',
      l.city,
      l.category,
      l.status,
      campaigns.find(c => c.id === l.campaignId)?.name || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'replied': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'converted': return 'bg-green-100 text-green-700 border-green-300';
      case 'ignored': return 'bg-slate-100 text-slate-500 border-slate-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  // Edit Lead Functions
  const openEditModal = (lead: BusinessLead) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      address: lead.address,
      category: lead.category,
    });
  };

  const closeEditModal = () => {
    setEditingLead(null);
    setEditForm({});
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;

    // Validate email format if provided
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    const updated = { ...editingLead, ...editForm };
    await updateLead(updated);
    await loadData();
    closeEditModal();
  };

  const enrichEmail = async (lead: BusinessLead) => {
    if (!lead.website) {
      alert('Website is required for email enrichment');
      return;
    }

    setEnriching(lead.id);
    setEnrichmentSuccess(prev => ({ ...prev, [lead.id]: false }));

    try {
      const settings = await getSettings();
      
      if (!settings.hunterApiKey) {
        alert('Hunter.io API key not configured. Please add it in Settings.');
        setEnriching(null);
        return;
      }

      const domain = new URL(lead.website).hostname.replace('www.', '');
      const result = await emailEnrichmentService.findEmail(domain, lead.name, settings.hunterApiKey);

      if (result.email) {
        const updated = { ...lead, email: result.email };
        await updateLead(updated);
        await loadData();
        setEnrichmentSuccess(prev => ({ ...prev, [lead.id]: true }));
        setTimeout(() => {
          setEnrichmentSuccess(prev => ({ ...prev, [lead.id]: false }));
        }, 3000);
      } else {
        alert('No email found for this lead');
      }
    } catch (error) {
      console.error('Enrichment error:', error);
      alert('Error enriching email. Please try again.');
    } finally {
      setEnriching(null);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchCampaign = filterCampaign === 'all' 
        ? true 
        : filterCampaign === 'unassigned' ? !l.campaignId : l.campaignId === filterCampaign;
    const matchStatus = filterStatus === 'all' ? true : l.status === filterStatus;
    return matchCampaign && matchStatus;
  });

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">My Leads</h2>
          <p className="text-slate-500">Manage and track your prospects</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={leads.length === 0}
          className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-slate-50">
            <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search leads..." 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="converted">Converted</option>
                <option value="ignored">Ignored</option>
            </select>

            <select 
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                <option value="all">All Campaigns</option>
                <option value="unassigned">Unassigned</option>
                {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>
        
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Business</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                        No leads found for this filter.
                    </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{lead.name}</div>
                        <div className="text-xs text-slate-400">{lead.category}</div>
                      </td>
                      <td className="px-6 py-4">{lead.city}</td>
                      <td className="px-6 py-4">
                        <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 appearance-none text-center ${getStatusColor(lead.status)}`}
                        >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="replied">Replied</option>
                            <option value="converted">Converted</option>
                            <option value="ignored">Ignored</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                            value={lead.campaignId || 'none'}
                            onChange={(e) => handleAssignCampaign(lead, e.target.value)}
                            className="bg-transparent border border-transparent hover:border-slate-300 rounded text-xs py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[150px] truncate"
                        >
                            <option value="none" className="text-slate-400">-- No Campaign --</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                            {lead.email ? (
                                <div className="flex items-center gap-1 text-slate-700">
                                    <Mail size={12} /> {lead.email}
                                </div>
                            ) : (
                                <span className="text-slate-400 italic text-xs block">No email</span>
                            )}
                            {lead.phone && (
                                <div className="flex items-center gap-1 text-slate-700 text-xs">
                                    <Phone size={12} /> {lead.phone}
                                </div>
                            )}
                            {lead.website && (
                                <a href={lead.website} target="_blank" className="text-blue-500 hover:underline block text-xs mt-1">
                                    {new URL(lead.website).hostname}
                                </a>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => openEditModal(lead)}
                                className="text-green-600 hover:text-green-800 font-medium text-xs flex items-center gap-1 bg-green-50 p-1.5 rounded"
                                title="Edit Lead"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={() => handleDeepResearch(lead)}
                                className="text-pink-600 hover:text-pink-800 font-medium text-xs flex items-center gap-1 bg-pink-50 p-1.5 rounded"
                                title="Deep Research & Icebreakers"
                            >
                                <Microscope size={14} />
                            </button>
                             <button 
                                onClick={() => handleGenerateCalendar(lead)}
                                className="text-purple-600 hover:text-purple-800 font-medium text-xs flex items-center gap-1 bg-purple-50 p-1.5 rounded"
                                title="Generate Content Calendar"
                            >
                                <CalendarDays size={14} />
                            </button>
                            <button 
                                onClick={() => handleEnrich(lead)}
                                disabled={!!enriching}
                                className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 bg-blue-50 p-1.5 rounded"
                                title="AI Enrichment"
                            >
                            {enriching === lead.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            </button>
                            <button 
                                onClick={() => handleDelete(lead.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1.5"
                                title="Delete Lead"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edit Lead</h3>
                <p className="text-sm text-slate-500">Update lead information</p>
              </div>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => handleEditFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={editForm.website || ''}
                    onChange={(e) => handleEditFormChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => handleEditFormChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category || ''}
                    onChange={(e) => handleEditFormChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Restaurant, Gym, etc."
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Calendar Modal */}
      {calendarLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">5-Day Content Plan</h3>
                        <p className="text-sm text-slate-500">For {calendarLead.name} ({calendarLead.city})</p>
                    </div>
                    <button onClick={() => setCalendarLead(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {generatingCalendar ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
                            <p className="text-slate-600">Generating personalized content calendar...</p>
                        </div>
                    ) : calendarContent ? (
                        <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                                {calendarContent}
                            </pre>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-8">No content generated yet.</p>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Deep Research Modal */}
      {researchLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Microscope className="text-pink-600" size={24} />
                            Deep Research & Icebreakers
                        </h3>
                        <p className="text-sm text-slate-500">For {researchLead.name} ({researchLead.city})</p>
                    </div>
                    <button onClick={() => setResearchLead(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {researching ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-pink-600 mb-4" size={48} />
                            <p className="text-slate-600">Performing deep research...</p>
                            <p className="text-xs text-slate-400 mt-2">This may take a moment</p>
                        </div>
                    ) : researchResult ? (
                        <div className="space-y-6">
                            {researchResult.error ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                                    {researchResult.error}
                                </div>
                            ) : (
                                <>
                                    {researchResult.summary && (
                                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                <Globe size={16} className="text-blue-600" />
                                                Business Summary
                                            </h4>
                                            <p className="text-sm text-slate-700 leading-relaxed">{researchResult.summary}</p>
                                        </div>
                                    )}

                                    {researchResult.icebreakers && researchResult.icebreakers.length > 0 && (
                                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                <Zap size={16} className="text-yellow-600" />
                                                Conversation Starters
                                            </h4>
                                            <ul className="space-y-2">
                                                {researchResult.icebreakers.map((ice: string, idx: number) => (
                                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="text-yellow-600 font-bold">•</span>
                                                        <span>{ice}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {researchResult.recentNews && researchResult.recentNews.length > 0 && (
                                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                <Globe size={16} className="text-green-600" />
                                                Recent News & Updates
                                            </h4>
                                            <ul className="space-y-2">
                                                {researchResult.recentNews.map((news: string, idx: number) => (
                                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="text-green-600 font-bold">•</span>
                                                        <span>{news}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-8">No research data available.</p>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
