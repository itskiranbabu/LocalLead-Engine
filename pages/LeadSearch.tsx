import React, { useState } from 'react';
import { Search, MapPin, Loader2, Plus, ExternalLink, Globe } from 'lucide-react';
import { searchBusinessesWithMaps } from '../services/geminiService';
import { addLeads, getSettings } from '../services/storageService';
import { BusinessLead } from '../types';

export const LeadSearch: React.FC = () => {
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Partial<BusinessLead>[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const leads = await searchBusinessesWithMaps(city, niche);
      setResults(leads);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during search.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const saveSelected = () => {
    const toSave = results.filter(r => r.id && selectedIds.has(r.id)) as BusinessLead[];
    addLeads(toSave);
    
    // Check if connected to sheets (mock)
    const settings: any = getSettings();
    const sheetsMsg = settings.googleSheetsConnected ? " and synced to Google Sheets" : "";

    alert(`Saved ${toSave.length} leads to your database${sheetsMsg}!`);
    setSelectedIds(new Set());
    setResults([]);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Find Local Leads</h2>
        <p className="text-slate-500">Powered by Google Maps Grounding via Gemini AI</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">City / Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="e.g. Austin, TX"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Type / Niche</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="e.g. Dentists, Coffee Shops"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Search Maps'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-700">Results ({results.length})</h3>
            <button
              onClick={saveSelected}
              disabled={selectedIds.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
              Save Selected ({selectedIds.size})
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => (
                <div 
                  key={item.id} 
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedIds.has(item.id!) 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => item.id && toggleSelection(item.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                    {item.rating && (
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center">
                        ★ {item.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-2 flex items-start gap-1">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    {item.address}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.website && (
                      <a 
                        href={item.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe size={12} />
                        Website
                      </a>
                    )}
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + item.address)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline flex items-center gap-1 bg-green-50 px-2 py-1 rounded"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={12} />
                        Google Maps
                    </a>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 border-t pt-2 border-slate-100 line-clamp-2">
                    {item.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};