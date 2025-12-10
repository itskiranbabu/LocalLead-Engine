import React, { useEffect, useState } from 'react';
import { getLeads, updateLead, getCampaigns, deleteLead } from '../services/storageService';
import { enrichLeadData, generateContentCalendar, performDeepResearch } from '../services/geminiService';
import { BusinessLead, Campaign } from '../types';
import { Download, Search, Sparkles, Loader2, Mail, Phone, Trash2, CalendarDays, X, Microscope, Globe } from 'lucide-react';

export const LeadsManager: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [enriching, setEnriching] = useState<string | null>(null); // ID of lead being enriched
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Content Calendar State
  const [calendarLead, setCalendarLead] = useState<BusinessLead | null>(null);
  const [calendarContent, setCalendarContent] = useState<string>('');
  const [generatingCalendar, setGeneratingCalendar] = useState(false);

  // Deep Research State
  const [researchLead, setResearchLead] = useState<BusinessLead | null>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [researching, setResearching] = useState(false);

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
    if(confirm('Are you sure you want to delete this lead?')) {
        await deleteLead(id);
        await loadData();
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Category', 'Status', 'Website', 'Campaign', 'Notes'];
    const rows = leads.map(l => {
        const campaignName = campaigns.find(c => c.id === l.campaignId)?.name || '';
        return [
            `"${l.id}"`,
            `"${l.name}"`,
            `"${l.email || ''}"`,
            `"${l.phone || ''}"`,
            `"${l.city}"`,
            `"${l.category}"`,
            `"${l.status}"`,
            `"${l.website || ''}"`,
            `"${campaignName}"`,
            `"${(l.notes || '').replace(/"/g, '""')}"`
        ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'replied': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'converted': return 'bg-green-100 text-green-700 border-green-200';
      case 'ignored': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
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
                            <p className="text-slate-500 font-medium">Researching local trends in {calendarLead.city}...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700 font-medium">
                            {calendarContent}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl flex justify-end">
                    <button 
                        onClick={() => setCalendarLead(null)}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Deep Research Modal */}
      {researchLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-pink-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-100 p-2 rounded-full text-pink-600">
                            <Microscope size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Deep Research Intelligence</h3>
                            <p className="text-sm text-slate-600">Analysis for {researchLead.name}</p>
                        </div>
                    </div>
                    <button onClick={() => setResearchLead(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                    {researching ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-pink-600 mb-4" size={48} />
                            <p className="text-slate-500 font-medium">Analyzing news and events for {researchLead.name}...</p>
                        </div>
                    ) : researchResult ? (
                        <div className="space-y-6">
                            {researchResult.error ? (
                                <div className="text-red-500 p-4 bg-red-50 rounded-lg">{researchResult.error}</div>
                            ) : (
                                <>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h4 className="font-bold text-slate-700 mb-2 uppercase text-xs tracking-wide">Summary</h4>
                                        <p className="text-slate-700 leading-relaxed">{researchResult.summary}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-pink-600 mb-3 flex items-center gap-2">
                                                <Sparkles size={16} /> Ice Breakers
                                            </h4>
                                            <ul className="space-y-3">
                                                {researchResult.iceBreakers?.map((point: string, i: number) => (
                                                    <li key={i} className="text-sm text-slate-700 bg-pink-50/50 p-3 rounded-lg border border-pink-100">
                                                        "{point}"
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-600 mb-3 flex items-center gap-2">
                                                <Globe size={16} /> Recent News/Activity
                                            </h4>
                                            <ul className="space-y-3">
                                                {researchResult.news?.map((news: string, i: number) => (
                                                    <li key={i} className="text-sm text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                        {news}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl flex justify-end">
                    <button 
                        onClick={() => setResearchLead(null)}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};