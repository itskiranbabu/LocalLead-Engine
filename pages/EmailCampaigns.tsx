import React, { useEffect, useState } from 'react';
import { emailCampaignService, EmailCampaign, EmailTemplate, EmailSequence } from '../services/emailCampaignService';
import { getLeads } from '../services/storageService';
import { BusinessLead } from '../types';
import { Mail, Plus, Play, Pause, Trash2, Eye, BarChart3, Send, Clock, CheckCircle, XCircle, MousePointerClick, Reply, AlertCircle } from 'lucide-react';

export const EmailCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Create campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    sequenceId: '',
    selectedLeadIds: [] as string[],
  });

  useEffect(() => {
    loadData();
    emailCampaignService.initialize();
  }, []);

  const loadData = async () => {
    setCampaigns(await emailCampaignService.getCampaigns());
    setTemplates(await emailCampaignService.getTemplates());
    setSequences(await emailCampaignService.getSequences());
    setLeads(await getLeads());
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.sequenceId || newCampaign.selectedLeadIds.length === 0) {
      alert('Please fill all fields and select at least one lead');
      return;
    }

    const campaign = await emailCampaignService.createCampaign({
      name: newCampaign.name,
      sequenceId: newCampaign.sequenceId,
      leadIds: newCampaign.selectedLeadIds,
      status: 'draft',
    });

    // Schedule emails
    const selectedLeads = leads.filter(l => newCampaign.selectedLeadIds.includes(l.id));
    await emailCampaignService.scheduleEmails(campaign.id, selectedLeads, newCampaign.sequenceId);

    setShowCreateModal(false);
    setNewCampaign({ name: '', sequenceId: '', selectedLeadIds: [] });
    loadData();
  };

  const handleStartCampaign = async (campaignId: string) => {
    await emailCampaignService.updateCampaign(campaignId, {
      status: 'active',
      startDate: new Date().toISOString(),
    });
    loadData();
    alert('Campaign started! Emails will be sent according to the schedule.');
  };

  const handlePauseCampaign = async (campaignId: string) => {
    await emailCampaignService.updateCampaign(campaignId, { status: 'paused' });
    loadData();
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await emailCampaignService.deleteCampaign(campaignId);
      loadData();
    }
  };

  const handleViewAnalytics = async (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    const data = await emailCampaignService.getCampaignAnalytics(campaign.id);
    setAnalytics(data);
    setShowAnalytics(true);
  };

  const toggleLeadSelection = (leadId: string) => {
    setNewCampaign(prev => ({
      ...prev,
      selectedLeadIds: prev.selectedLeadIds.includes(leadId)
        ? prev.selectedLeadIds.filter(id => id !== leadId)
        : [...prev.selectedLeadIds, leadId],
    }));
  };

  const selectAllLeads = () => {
    const leadsWithEmail = leads.filter(l => l.email);
    setNewCampaign(prev => ({
      ...prev,
      selectedLeadIds: leadsWithEmail.map(l => l.id),
    }));
  };

  const deselectAllLeads = () => {
    setNewCampaign(prev => ({ ...prev, selectedLeadIds: [] }));
  };

  const getSequenceName = (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    return sequence?.name || 'Unknown';
  };

  const getStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Email Campaigns</h2>
          <p className="text-slate-600 mt-1">Automate your email outreach with sequences</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Eye size={18} />
            View Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Mail size={48} className="mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No campaigns yet</h3>
            <p className="text-slate-600 mb-4">Create your first email campaign to start automating outreach</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Create First Campaign
            </button>
          </div>
        ) : (
          campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{campaign.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Sequence: {getSequenceName(campaign.sequenceId)} • {campaign.leadIds.length} leads
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Send size={16} />
                    <span className="text-2xl font-bold">{campaign.stats.sent}</span>
                  </div>
                  <p className="text-xs text-slate-600">Sent</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <Eye size={16} />
                    <span className="text-2xl font-bold">{campaign.stats.opened}</span>
                  </div>
                  <p className="text-xs text-slate-600">Opened</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                    <MousePointerClick size={16} />
                    <span className="text-2xl font-bold">{campaign.stats.clicked}</span>
                  </div>
                  <p className="text-xs text-slate-600">Clicked</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-teal-600 mb-1">
                    <Reply size={16} />
                    <span className="text-2xl font-bold">{campaign.stats.replied}</span>
                  </div>
                  <p className="text-xs text-slate-600">Replied</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                    <XCircle size={16} />
                    <span className="text-2xl font-bold">{campaign.stats.bounced}</span>
                  </div>
                  <p className="text-xs text-slate-600">Bounced</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleStartCampaign(campaign.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play size={16} />
                    Start Campaign
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    onClick={() => handlePauseCampaign(campaign.id)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Pause size={16} />
                    Pause
                  </button>
                )}
                <button
                  onClick={() => handleViewAnalytics(campaign)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>
                <button
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <h3 className="text-2xl font-bold">Create Email Campaign</h3>
              <p className="text-blue-100 mt-1">Set up automated email sequences for your leads</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., PG Owners Outreach - December 2024"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Select Sequence */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Sequence</label>
                <select
                  value={newCampaign.sequenceId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, sequenceId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a sequence...</option>
                  {sequences.map(seq => (
                    <option key={seq.id} value={seq.id}>
                      {seq.name} ({seq.steps.length} emails)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Leads */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Select Leads ({newCampaign.selectedLeadIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllLeads}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllLeads}
                      className="text-sm text-slate-600 hover:text-slate-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="border border-slate-300 rounded-lg max-h-64 overflow-y-auto">
                  {leads.filter(l => l.email).map(lead => (
                    <label
                      key={lead.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-200 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={newCampaign.selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{lead.name}</div>
                        <div className="text-sm text-slate-600">{lead.email}</div>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {lead.category}
                      </span>
                    </label>
                  ))}
                  {leads.filter(l => l.email).length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No leads with email addresses found.</p>
                      <p className="text-sm mt-1">Enrich your leads first to get email addresses.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateCampaign}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Campaign
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
              <h3 className="text-2xl font-bold">Email Templates</h3>
              <p className="text-purple-100 mt-1">Pre-built templates for your campaigns</p>
            </div>

            <div className="p-6 space-y-4">
              {templates.map(template => (
                <div key={template.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">{template.name}</h4>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-1 inline-block">
                        {template.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded p-3 mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-1">Subject:</p>
                    <p className="text-sm text-slate-600 mb-3">{template.subject}</p>
                    <p className="text-sm font-medium text-slate-700 mb-1">Body:</p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{template.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && selectedCampaign && analytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-xl">
              <h3 className="text-2xl font-bold">Campaign Analytics</h3>
              <p className="text-green-100 mt-1">{selectedCampaign.name}</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="text-blue-600" size={20} />
                    <span className="text-sm font-medium text-slate-700">Emails Sent</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{analytics.sent}</p>
                  <p className="text-xs text-slate-600 mt-1">of {analytics.totalScheduled} scheduled</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="text-green-600" size={20} />
                    <span className="text-sm font-medium text-slate-700">Open Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{analytics.openRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-600 mt-1">{analytics.opened} opens</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="text-purple-600" size={20} />
                    <span className="text-sm font-medium text-slate-700">Click Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{analytics.clickRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-600 mt-1">{analytics.clicked} clicks</p>
                </div>

                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Reply className="text-teal-600" size={20} />
                    <span className="text-sm font-medium text-slate-700">Reply Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-teal-600">{analytics.replyRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-600 mt-1">{analytics.replied} replies</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Clock className="text-yellow-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">📧 Email Sending Status</p>
                    <p>This is a demo version. In production, emails will be sent via Gmail/SMTP integration.</p>
                    <p className="mt-2">To enable actual sending, configure your email settings in the Settings page.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAnalytics(false)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
