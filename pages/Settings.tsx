import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/storageService';
import { AppSettings } from '../types';
import { Save, Sheet, Check, LogOut, Plus, X } from 'lucide-react', Mail, Eye, EyeOff }
import { useAuth } from '../context/AuthContext';

interface ExtendedSettings extends AppSettings {
  googleSheetsConnected?: boolean;
  googleSheetId?: string;
}
  enrichmentService?: 'hunter' | 'apollo' | 'clearbit' | null;
  enrichmentApiKey?: string;
  enrichmentEnabled?: boolean;
  showApiKey?: boolean;

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState<ExtendedSettings>({
    userName: '',
    companyName: '',
    dailyEmailLimit: 50,
    offerings: [],
    googleSheetsConnected: false,
    googleSheetId: ''
  });
  const [newOffering, setNewOffering] = useState('');
  const [saved, setSaved] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      const loaded = await getSettings() as ExtendedSettings;
      setFormData({
          ...loaded,
          offerings: loaded.offerings || [] 
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleSheets = () => {
    setFormData(prev => ({
        ...prev,
        googleSheetsConnected: !prev.googleSheetsConnected,
        googleSheetId: !prev.googleSheetsConnected ? '1BxiMvs0XRA5nFNY...' : ''
    }));
  };

  const addOffering = () => {
    if (newOffering.trim()) {
        setFormData(prev => ({
            ...prev,
            offerings: [...prev.offerings, newOffering.trim()]
        }));
        setNewOffering('');
    }
  };

  const removeOffering = (index: number) => {
    setFormData(prev => ({
        ...prev,
        offerings: prev.offerings.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Application Settings</h2>
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Logged in as <span className="font-bold text-slate-700">{user?.name}</span></span>
            <button onClick={logout} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                <LogOut size={18} />
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Profile Section */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Profile & Email Config</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name (Sender Name)</label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
          </section>

          {/* My Services Section */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">My Offerings</h3>
              <p className="text-sm text-slate-500 mb-4">Define the services you want to pitch to leads. AI will use these to generate tailored messages.</p>
              
              <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newOffering}
                    onChange={e => setNewOffering(e.target.value)}
                    placeholder="e.g. Social Media Management"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOffering())}
                  />
                  <button 
                    type="button"
                    onClick={addOffering}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2"
                  >
                    <Plus size={16} /> Add
                  </button>
              </div>

              <div className="flex flex-wrap gap-2">
                  {formData.offerings.length === 0 && <span className="text-slate-400 text-sm italic">No services added yet.</span>}
                  {formData.offerings.map((offering, idx) => (
                      <div key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border border-blue-100">
                          {offering}
                          <button type="button" onClick={() => removeOffering(idx)} className="hover:text-red-500">
                              <X size={14} />
                          </button>
                      </div>
                  ))}
              </div>
          </section>

          {/* Integrations Section */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Integrations</h3>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${formData.googleSheetsConnected ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                              <Sheet size={24} />
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-700">Google Sheets Sync</h4>
                              <p className="text-sm text-slate-500">
                                  {formData.googleSheetsConnected 
                                    ? 'Connected to your Google Account.' 
                                    : 'Connect to automatically save leads to a sheet.'}
                              </p>
                          </div>
                      </div>
                      <button 
                        type="button"
                        onClick={toggleSheets}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            formData.googleSheetsConnected 
                                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                          {formData.googleSheetsConnected ? 'Disconnect' : 'Connect Account'}
                      </button>
                  </div>
                  
                  {formData.googleSheetsConnected && (
                      <div className="mt-4 pl-[52px]">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sheet ID</label>
                          <div className="flex gap-2">
                             <input 
                                disabled
                                value={formData.googleSheetId}
                                className="flex-1 bg-white border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-500"
                             />
                             <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                 <Check size={14} /> Synced
                             </div>
                          </div>
                      </div>
      
          {/* Email Enrichment Service Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${formData.enrichmentEnabled ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Email Enrichment Service</h4>
                  <p className="text-sm text-slate-500">
                    {formData.enrichmentEnabled 
                      ? `Connected to ${formData.enrichmentService || 'Hunter.io'}` 
                      : 'Automatically find business emails for leads'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  enrichmentEnabled: !prev.enrichmentEnabled
                }))}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  formData.enrichmentEnabled 
                    ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {formData.enrichmentEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {formData.enrichmentEnabled && (
              <div className="mt-4 pl-[52px] space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Service Provider
                  </label>
                  <select 
                    name="enrichmentService"
                    value={formData.enrichmentService || 'hunter'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enrichmentService: e.target.value as 'hunter' | 'apollo' | 'clearbit'
                    }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  >
                    <option value="hunter">Hunter.io (Recommended)</option>
                    <option value="apollo">Apollo.io</option>
                    <option value="clearbit">Clearbit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      name="enrichmentApiKey"
                      value={formData.enrichmentApiKey || ''}
                      onChange={handleChange}
                      placeholder="Paste your API key here..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
                  )}
              </div>
          </section>

          {/* Limits Section */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Safety Limits</h3>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Daily Email Limit</label>
                <div className="flex items-center gap-3">
                    <input
                    type="number"
                    name="dailyEmailLimit"
                    value={formData.dailyEmailLimit}
                    onChange={handleChange}
                    className="w-32 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-sm text-slate-500">emails / day</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">We recommend starting with 50 to avoid spam filters.</p>
            </div>
          </section>

          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
            >
              <Save size={18} />
              Save Settings
            </button>
            {saved && <span className="text-green-600 font-medium flex items-center gap-1"><Check size={18}/> Saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
};
