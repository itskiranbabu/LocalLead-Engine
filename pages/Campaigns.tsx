import React, { useState, useEffect } from 'react';
import { Plus, Target, Calendar, BarChart2, Trash2, Edit2, Play, Pause } from 'lucide-react';
import { getCampaigns, saveCampaign, deleteCampaign, getLeads } from '../services/storageService';
import { Campaign, BusinessLead } from '../types';

export const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Campaign>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCampaigns(getCampaigns());
    setLeads(getLeads());
  };

  const handleCreate = () => {
    setFormData({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      niche: '',
      location: '',
      status: 'active',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      saveCampaign(formData as Campaign);
      setIsModalOpen(false);
      loadData();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this campaign?")) {
      deleteCampaign(id);
      loadData();
    }
  };

  const toggleStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    saveCampaign({ ...campaign, status: newStatus });
    loadData();
  };

  const getStats = (campaignId: string) => {
    const campaignLeads = leads.filter(l => l.campaignId === campaignId);
    const total = campaignLeads.length;
    const contacted = campaignLeads.filter(l => l.status !== 'new').length;
    const replied = campaignLeads.filter(l => l.status === 'replied').length;
    return { total, contacted, replied };
  };

  return (
    <div className="p-8 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Campaigns</h2>
          <p className="text-slate-500">Organize and track your outreach efforts</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Target size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No campaigns yet</h3>
            <p className="text-slate-400 mb-4">Create a campaign to group your leads.</p>
            <button onClick={handleCreate} className="text-blue-600 font-medium hover:underline">
              Create your first campaign
            </button>
          </div>
        )}

        {campaigns.map(campaign => {
          const stats = getStats(campaign.id);
          return (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{campaign.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full capitalize ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                      campaign.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {campaign.status}
                    </span>
                    <span>• {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleStatus(campaign)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                    {campaign.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={() => handleDelete(campaign.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6 line-clamp-2 h-10">
                {campaign.description || "No description provided."}
              </p>

              <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-slate-100 mb-4">
                 <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase font-bold">Leads</div>
                    <div className="font-bold text-slate-800 text-lg">{stats.total}</div>
                 </div>
                 <div className="text-center border-l border-slate-100">
                    <div className="text-xs text-slate-400 uppercase font-bold">Sent</div>
                    <div className="font-bold text-slate-800 text-lg">{stats.contacted}</div>
                 </div>
                 <div className="text-center border-l border-slate-100">
                    <div className="text-xs text-slate-400 uppercase font-bold">Replies</div>
                    <div className="font-bold text-slate-800 text-lg">{stats.replied}</div>
                 </div>
              </div>

              <div className="mt-auto flex justify-between items-center">
                 <div className="text-xs text-slate-400">
                    {campaign.niche} • {campaign.location}
                 </div>
                 <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${stats.total > 0 ? (stats.contacted / stats.total) * 100 : 0}%` }}
                    ></div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Create Campaign</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                <input 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Summer Dentists Outreach"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Goals for this campaign..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Niche</label>
                   <input 
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={formData.niche || ''}
                     onChange={e => setFormData({...formData, niche: e.target.value})}
                     placeholder="e.g. Dentists"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                   <input 
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={formData.location || ''}
                     onChange={e => setFormData({...formData, location: e.target.value})}
                     placeholder="e.g. New York"
                   />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};