import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/storageService';
import { AppSettings } from '../types';
import { Save, Sheet, Check, LogOut, Plus, X, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ExtendedSettings extends AppSettings {
  googleSheetsConnected?: boolean;
  googleSheetId?: string;
  enrichmentService?: 'hunter' | 'apollo' | 'clearbit' | null;
  enrichmentApiKey?: string;
  enrichmentEnabled?: boolean;
  showApiKey?: boolean;
}

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
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
    fetchUserDisplayName();
  }, [user]);

  const fetchUserDisplayName = async () => {
    if (isSupabaseConfigured()) {
      const { data: { session } } = await supabase!.auth.getSession();
      if (session?.user) {
        // Try to get full_name from user_metadata, fallback to email username
        const fullName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name ||
                        session.user.email?.split('@')[0] || 
                        'User';
        setDisplayName(fullName);
      }
    } else {
      // Fallback to localStorage
      setDisplayName(user?.name || user?.email?.split('@')[0] || 'User');
    }
  };

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
            <span className="text-sm text-slate-500">
              Logged in as <span className="font-bold text-slate-700">{displayName}</span>
            </span>
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
          </section>

          {/* N8N Configuration */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">N8N Email Integration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">N8N Webhook URL</label>
                  <input
                    type="url"
                    name="n8nWebhookUrl"
                    value={formData.n8nWebhookUrl || ''}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-n8n-instance.com/webhook/..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Your N8N workflow webhook URL for sending emails</p>
                </div>
              </div>
          </section>

          {/* Email Enrichment */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Email Enrichment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hunter.io API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      name="hunterApiKey"
                      value={formData.hunterApiKey || ''}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your Hunter.io API key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Get your API key from <a href="https://hunter.io/api-keys" target="_blank" className="text-blue-500 hover:underline">hunter.io/api-keys</a>
                  </p>
                </div>
              </div>
          </section>

          {/* Offerings */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Your Offerings</h3>
              <div className="space-y-3">
                  <div className="flex gap-2">
                      <input
                          type="text"
                          value={newOffering}
                          onChange={(e) => setNewOffering(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOffering())}
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Social Media Marketing"
                      />
                      <button
                          type="button"
                          onClick={addOffering}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                          <Plus size={16} />
                          Add
                      </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {formData.offerings.map((offering, idx) => (
                          <div key={idx} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                              {offering}
                              <button
                                  type="button"
                                  onClick={() => removeOffering(idx)}
                                  className="hover:text-blue-900"
                              >
                                  <X size={14} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </section>

          {/* Limits */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Sending Limits</h3>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Daily Email Limit</label>
                  <input
                      type="number"
                      name="dailyEmailLimit"
                      value={formData.dailyEmailLimit}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum emails you can send per day</p>
              </div>
          </section>

          {/* Google Sheets Integration */}
          <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Integrations</h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                      <Sheet className="text-green-600" size={24} />
                      <div>
                          <p className="font-medium text-slate-800">Google Sheets</p>
                          <p className="text-xs text-slate-500">Export leads to Google Sheets</p>
                      </div>
                  </div>
                  <button
                      type="button"
                      onClick={toggleSheets}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.googleSheetsConnected
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                  >
                      {formData.googleSheetsConnected ? 'Connected' : 'Connect'}
                  </button>
              </div>
              {formData.googleSheetsConnected && (
                  <div className="mt-3">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sheet ID</label>
                      <input
                          type="text"
                          name="googleSheetId"
                          value={formData.googleSheetId}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1BxiMvs0XRA5nFNY..."
                      />
                  </div>
              )}
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
              <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                  {saved ? (
                      <>
                          <Check size={18} />
                          Saved!
                      </>
                  ) : (
                      <>
                          <Save size={18} />
                          Save Settings
                      </>
                  )}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};
