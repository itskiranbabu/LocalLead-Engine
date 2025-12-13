import React, { useEffect, useState } from 'react';
import { emailCampaignService, EmailCampaign, EmailTemplate, EmailSequence } from '../services/emailCampaignService';
import { emailSendingService } from '../services/emailSendingService';
import { getLeads } from '../services/storageService';
import { BusinessLead } from '../types';
import { Mail, Plus, Play, Pause, Trash2, Eye, BarChart3, Send, Clock, CheckCircle, XCircle, MousePointerClick, Reply, AlertCircle, Loader2 } from 'lucide-react';

export const EmailCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
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
    initializeAndLoadData();
  }, []);

  const initializeAndLoadData = async () => {
    try {
      setLoading(true);
      // Initialize sequences and templates FIRST
      await emailCampaignService.initialize();
      // Then load all data
      await loadData();
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      setLoading(false);
    }
  };

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
    try {
      setSending(true);

      // Check if N8N is configured
      const n8nStatus = await emailSendingService.getN8NStatus();
      
      if (!n8nStatus.configured) {
        alert('⚠️ N8N webhook URL not configured!\n\nPlease configure your N8N webhook URL in Settings to send emails.\n\nFor now, the campaign will be marked as active but emails won\'t be sent until N8N is configured.');
        
        // Still mark as active so user can configure later
        await emailCampaignService.updateCampaign(campaignId, {
          status: 'active',
          startDate: new Date().toISOString(),
        });
        
        loadData();
        return;
      }

      // Update campaign status to active
      await emailCampaignService.updateCampaign(campaignId, {
        status: 'active',
        startDate: new Date().toISOString(),
      });

      // Process and send scheduled emails
      console.log('Processing scheduled emails for campaign:', campaignId);
      await emailSendingService.processScheduledEmails();

      // Reload data to show updated stats
      await loadData();

      // Get updated campaign stats
      const updatedCampaign = await emailCampaignService.getCampaign(campaignId);
      const campaignLogs = await emailSendingService.getEmailLogs(campaignId);
      
      // Update campaign stats based on email logs
      const stats = {
        sent: campaignLogs.filter(l => 
          l.status === 'sent' || 
          l.status === 'opened' || 
          l.status === 'clicked' || 
          l.status === 'replied'
        ).length,
        opened: campaignLogs.filter(l => 
          l.status === 'opened' || 
          l.status === 'clicked' || 
          l.status === 'replied'
        ).length,
        clicked: campaignLogs.filter(l => 
          l.status === 'clicked' || 
          l.status === 'replied'
        ).length,
        replied: campaignLogs.filter(l => l.status === 'replied').length,
        bounced: campaignLogs.filter(l => l.status === 'bounced').length,
      };

      await emailCampaignService.updateCampaign(campaignId, { stats });
      
      await loadData();

      alert(`✅ Campaign started!\n\n${stats.sent} emails sent successfully.\n\nEmails will continue to be sent according to the sequence schedule.`);
    } catch (error) {
      console.error('Failed to start campaign:', error);
      alert('❌ Failed to start campaign. Please check console for details.');
    } finally {
      setSending(false);
    }
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

  if (loading) {
    return (
      <div className=\"p-8 flex items-center justify-center min-h-screen\">
        <div className=\"text-center\">
          <Loader2 size={48} className=\"animate-spin text-blue-600 mx-auto mb-4\" />
          <p className=\"text-slate-600\">Loading email campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"p-8\">
      <div className=\"flex justify-between items-center mb-6\">
        <div>
          <h2 className=\"text-2xl font-bold text-slate-800\">Email Campaigns</h2>
          <p className=\"text-slate-600 mt-1\">Automate your email outreach with sequences</p>
        </div>
        <div className=\"flex gap-3\">
          <button
            onClick={() => setShowTemplateModal(true)}
            className=\"bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors\"
          >
            <Eye size={18} />
            View Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className=\"bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors\"
          >
            <Plus size={18} />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className=\"grid gap-4\">
        {campaigns.length === 0 ? (
          <div className=\"bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center\">
            <Mail size={48} className=\"mx-auto text-slate-300 mb-4\" />
            <h3 className=\"text-lg font-semibold text-slate-800 mb-2\">No campaigns yet</h3>
            <p className=\"text-slate-600 mb-4\">Create your first email campaign to start automating outreach</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className=\"bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors\"
            >
              <Plus size={18} />
              Create Campaign
            </button>
          </div>
        ) : (
          campaigns.map(campaign => (
            <div key={campaign.id} className=\"bg-white rounded-xl shadow-sm border border-slate-200 p-6\">
              <div className=\"flex justify-between items-start mb-4\">
                <div>
                  <h3 className=\"text-lg font-semibold text-slate-800\">{campaign.name}</h3>
                  <p className=\"text-sm text-slate-600 mt-1\">
                    Sequence: {getSequenceName(campaign.sequenceId)} • {campaign.leadIds.length} leads
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              {/* Stats */}
              <div className=\"grid grid-cols-5 gap-4 mb-4\">
                <div className=\"text-center\">
                  <div className=\"flex items-center justify-center gap-1 text-slate-600 mb-1\">
                    <Send size={16} />
                    <span className=\"text-xs\">Sent</span>
                  </div>
                  <div className=\"text-2xl font-bold text-slate-800\">{campaign.stats.sent}</div>
                </div>
                <div className=\"text-center\">
                  <div className=\"flex items-center justify-center gap-1 text-blue-600 mb-1\">
                    <Eye size={16} />
                    <span className=\"text-xs\">Opened</span>
                  </div>
                  <div className=\"text-2xl font-bold text-blue-600\">{campaign.stats.opened}</div>
                </div>
                <div className=\"text-center\">
                  <div className=\"flex items-center justify-center gap-1 text-green-600 mb-1\">
                    <MousePointerClick size={16} />
                    <span className=\"text-xs\">Clicked</span>
                  </div>
                  <div className=\"text-2xl font-bold text-green-600\">{campaign.stats.clicked}</div>
                </div>
                <div className=\"text-center\">
                  <div className=\"flex items-center justify-center gap-1 text-purple-600 mb-1\">
                    <Reply size={16} />
                    <span className=\"text-xs\">Replied</span>
                  </div>
                  <div className=\"text-2xl font-bold text-purple-600\">{campaign.stats.replied}</div>
                </div>
                <div className=\"text-center\">
                  <div className=\"flex items-center justify-center gap-1 text-red-600 mb-1\">
                    <XCircle size={16} />
                    <span className=\"text-xs\">Bounced</span>
                  </div>
                  <div className=\"text-2xl font-bold text-red-600\">{campaign.stats.bounced}</div>
                </div>
              </div>

              {/* Actions */}
              <div className=\"flex gap-2\">
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleStartCampaign(campaign.id)}
                    disabled={sending}
                    className=\"flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed\"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={18} className=\"animate-spin\" />
                        Sending Emails...
                      </>
                    ) : (
                      <>
                        <Play size={18} />
                        Start Campaign
                      </>
                    )}
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    onClick={() => handlePauseCampaign(campaign.id)}
                    className=\"flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors\"
                  >
                    <Pause size={18} />
                    Pause Campaign
                  </button>
                )}
                <button
                  onClick={() => handleViewAnalytics(campaign)}
                  className=\"flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors\"
                >
                  <BarChart3 size={18} />
                  View Analytics
                </button>
                <button
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  className=\"bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors\"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
          <div className=\"bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto\">
            <div className=\"p-6 border-b border-slate-200\">
              <h3 className=\"text-xl font-bold text-slate-800\">Create Email Campaign</h3>
              <p className=\"text-slate-600 mt-1\">Set up your automated email sequence</p>
            </div>

            <div className=\"p-6 space-y-6\">
              {/* Campaign Name */}
              <div>
                <label className=\"block text-sm font-medium text-slate-700 mb-2\">
                  Campaign Name
                </label>
                <input
                  type=\"text\"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=\"e.g., Gym Outreach - January 2025\"
                  className=\"w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                />
              </div>

              {/* Email Sequence */}
              <div>
                <label className=\"block text-sm font-medium text-slate-700 mb-2\">
                  Email Sequence
                </label>
                <select
                  value={newCampaign.sequenceId}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, sequenceId: e.target.value }))}
                  className=\"w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                >
                  <option value=\"\">Select a sequence...</option>
                  {sequences.map(seq => (
                    <option key={seq.id} value={seq.id}>
                      {seq.name} ({seq.steps.length} steps)
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Selection */}
              <div>
                <div className=\"flex justify-between items-center mb-2\">
                  <label className=\"block text-sm font-medium text-slate-700\">
                    Select Leads ({newCampaign.selectedLeadIds.length} selected)
                  </label>
                  <div className=\"flex gap-2\">
                    <button
                      onClick={selectAllLeads}
                      className=\"text-sm text-blue-600 hover:text-blue-700\"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllLeads}
                      className=\"text-sm text-slate-600 hover:text-slate-700\"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className=\"border border-slate-300 rounded-lg max-h-64 overflow-y-auto\">
                  {leads.filter(l => l.email).length === 0 ? (
                    <div className=\"p-4 text-center text-slate-600\">
                      No leads with email addresses found. Please enrich your leads first.
                    </div>
                  ) : (
                    leads.filter(l => l.email).map(lead => (
                      <label
                        key={lead.id}
                        className=\"flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0\"
                      >
                        <input
                          type=\"checkbox\"
                          checked={newCampaign.selectedLeadIds.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className=\"w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500\"
                        />
                        <div className=\"flex-1\">
                          <div className=\"font-medium text-slate-800\">{lead.name}</div>
                          <div className=\"text-sm text-slate-600\">{lead.email}</div>
                          <div className=\"text-xs text-slate-500\">{lead.category}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className=\"p-6 border-t border-slate-200 flex justify-end gap-3\">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCampaign({ name: '', sequenceId: '', selectedLeadIds: [] });
                }}
                className=\"px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors\"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className=\"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors\"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
          <div className=\"bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto\">
            <div className=\"p-6 border-b border-slate-200\">
              <h3 className=\"text-xl font-bold text-slate-800\">Email Templates</h3>
              <p className=\"text-slate-600 mt-1\">Pre-built templates for your campaigns</p>
            </div>

            <div className=\"p-6 space-y-4\">
              {templates.map(template => (
                <div key={template.id} className=\"border border-slate-200 rounded-lg p-4\">
                  <div className=\"flex justify-between items-start mb-2\">
                    <div>
                      <h4 className=\"font-semibold text-slate-800\">{template.name}</h4>
                      <span className=\"text-xs text-slate-500 capitalize\">{template.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className=\"bg-slate-50 rounded p-3 mb-2\">
                    <div className=\"text-sm font-medium text-slate-700 mb-1\">Subject:</div>
                    <div className=\"text-sm text-slate-600\">{template.subject}</div>
                  </div>
                  <div className=\"bg-slate-50 rounded p-3\">
                    <div className=\"text-sm font-medium text-slate-700 mb-1\">Body:</div>
                    <div className=\"text-sm text-slate-600 whitespace-pre-wrap\">{template.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className=\"p-6 border-t border-slate-200 flex justify-end\">
              <button
                onClick={() => setShowTemplateModal(false)}
                className=\"px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors\"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && selectedCampaign && analytics && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
          <div className=\"bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto\">
            <div className=\"p-6 border-b border-slate-200\">
              <h3 className=\"text-xl font-bold text-slate-800\">{selectedCampaign.name}</h3>
              <p className=\"text-slate-600 mt-1\">Campaign Analytics</p>
            </div>

            <div className=\"p-6\">
              <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-6\">
                <div className=\"bg-blue-50 rounded-lg p-4\">
                  <div className=\"text-sm text-blue-600 mb-1\">Open Rate</div>
                  <div className=\"text-2xl font-bold text-blue-700\">{analytics.openRate.toFixed(1)}%</div>
                </div>
                <div className=\"bg-green-50 rounded-lg p-4\">
                  <div className=\"text-sm text-green-600 mb-1\">Click Rate</div>
                  <div className=\"text-2xl font-bold text-green-700\">{analytics.clickRate.toFixed(1)}%</div>
                </div>
                <div className=\"bg-purple-50 rounded-lg p-4\">
                  <div className=\"text-sm text-purple-600 mb-1\">Reply Rate</div>
                  <div className=\"text-2xl font-bold text-purple-700\">{analytics.replyRate.toFixed(1)}%</div>
                </div>
                <div className=\"bg-red-50 rounded-lg p-4\">
                  <div className=\"text-sm text-red-600 mb-1\">Bounce Rate</div>
                  <div className=\"text-2xl font-bold text-red-700\">{analytics.bounceRate.toFixed(1)}%</div>
                </div>
              </div>

              <div className=\"grid grid-cols-2 md:grid-cols-3 gap-4\">
                <div className=\"border border-slate-200 rounded-lg p-4\">
                  <div className=\"text-sm text-slate-600 mb-1\">Total Scheduled</div>
                  <div className=\"text-xl font-bold text-slate-800\">{analytics.totalScheduled}</div>
                </div>
                <div className=\"border border-slate-200 rounded-lg p-4\">
                  <div className=\"text-sm text-slate-600 mb-1\">Sent</div>
                  <div className=\"text-xl font-bold text-slate-800\">{analytics.sent}</div>
                </div>
                <div className=\"border border-slate-200 rounded-lg p-4\">
                  <div className=\"text-sm text-slate-600 mb-1\">Opened</div>
                  <div className=\"text-xl font-bold text-blue-600\">{analytics.opened}</div>
                </div>
                <div className=\"border border-slate-200 rounded-lg p-4\">
                  <div className=\"text-sm text-slate-600 mb-1\">Clicked</div>
                  <div className=\"text-xl font-bold text-green-600\">{analytics.clicked}</div>
                </div>
                <div className=\"border border-slate-200 rounded-lg p-4\">
                  <div className=\"text-sm text-slate-600 mb-1\">Replied</div>
                  <div className=\"text-xl font-bold text-purple-600\">{analytics.replied}</div>
                </div>
                <div className=\"border border-slate-200 rounded-lg p-4\">
                  <div className=\"text-sm text-slate-600 mb-1\">Failed</div>
                  <div className=\"text-xl font-bold text-red-600\">{analytics.failed}</div>
                </div>
              </div>
            </div>

            <div className=\"p-6 border-t border-slate-200 flex justify-end\">
              <button
                onClick={() => {
                  setShowAnalytics(false);
                  setSelectedCampaign(null);
                  setAnalytics(null);
                }}
                className=\"px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors\"
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
