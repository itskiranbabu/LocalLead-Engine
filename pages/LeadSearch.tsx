import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, Plus, ExternalLink, Globe, AlertTriangle, History, Clock } from 'lucide-react';
import { searchBusinessesWithMaps } from '../services/geminiService';
import { addLeads, getSettings, getSearchHistory, addToSearchHistory, getLastSearchResults, saveLastSearchResults } from '../services/storageService';
import { BusinessLead, SearchHistoryItem } from '../types';

export const LeadSearch: React.FC = () => {
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Partial<BusinessLead>[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    // Load History and Last Results
    setHistory(getSearchHistory());
    const last = getLastSearchResults();
    if (last && last.length > 0) {
        setResults(last);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(city, niche);
  };

  const performSearch = async (sCity: string, sNiche: string) => {
    if (!sCity.trim() || !sNiche.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const leads = await searchBusinessesWithMaps(sCity, sNiche);
      
      // Auto-tagging and scoring logic
      const processed = leads.map(l => {
          const tags: string[] = [];
          let score = 50; // Base score

          if (!l.website) {
              tags.push('Needs Website');
              score += 20; // High opportunity if we sell web design
          }
          if (l.rating && l.rating < 4.0) {
              tags.push('Reputation Mgmt');
              score += 10;
          }
          if (l.rating && l.rating > 4.5) {
              score += 10; // Good business likely to pay
          }
          if (l.phone) score += 10;

          return {
              ...l,
              score: Math.min(score, 100),
              tags,
              potentialValue: 25000 // Default value in INR (₹25,000)
          };
      });

      setResults(processed);
      saveLastSearchResults(processed);

      // Save History
      const historyItem: SearchHistoryItem = {
          id: crypto.randomUUID(),
          city: sCity,
          niche: sNiche,
          date: new Date().toISOString(),
          resultCount: processed.length
      };
      addToSearchHistory(historyItem);
      setHistory(getSearchHistory()); // Reload history

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Quota')) {
        setError('AI Quota Exceeded. Please wait a moment or upgrade your plan.');
      } else {
        setError(err.message || 'An error occurred during search.');
      }
    } finally {
      setLoading(false);
    }
  };

  const restoreHistory = (item: SearchHistoryItem) => {
      setCity(item.city);
      setNiche(item.niche);
      performSearch(item.city, item.niche);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const saveSelected = async () => {
    const toSave = results.filter(r => r.id && selectedIds.has(r.id)) as BusinessLead[];
    await addLeads(toSave);
    
    const settings = await getSettings();
    const sheetsMsg = settings.googleSheetsConnected ? " and synced to Google Sheets" : "";
    
    const totalVal = toSave.reduce((acc, curr) => acc + (curr.potentialValue || 0), 0);
    const formattedVal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalVal);

    alert(`Saved ${toSave.length} leads!\nAdded Pipeline Value: ${formattedVal}${sheetsMsg}`);
    setSelectedIds(new Set());
    // Don't clear results, keep them visible
  };

  const getScoreColor = (score?: number) => {
      if (!score) return 'bg-slate-100 text-slate-500';
      if (score >= 80) return 'bg-green-100 text-green-700';
      if (score >= 60) return 'bg-yellow-100 text-yellow-700';
      return 'bg-red-100 text-red-700';
  };

  return (
    <div className="p-8 h-full flex flex-col md:flex-row gap-6">
      {/* Left History Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <History size={20} className="text-slate-400" /> Recent
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {history.length === 0 ? (
                 <div className="p-6 text-center text-slate-400 text-sm">No history yet.</div>
             ) : (
                 <div className="divide-y divide-slate-100">
                     {history.map(item => (
                         <button 
                            key={item.id}
                            onClick={() => restoreHistory(item)}
                            className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                         >
                             <div className="font-bold text-slate-700 text-sm">{item.niche}</div>
                             <div className="text-xs text-slate-500 mb-1">{item.city}</div>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Clock size={10} /> {new Date(item.date).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                    {item.resultCount}
                                </span>
                             </div>
                         </button>
                     ))}
                 </div>
             )}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
          <div className="mb-6">
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
                    placeholder="e.g. Pune, Bangalore, Mumbai"
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
                    placeholder="e.g. Dentists, Cafes, Boutiques"
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
            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}
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
                      className={`border rounded-lg p-4 transition-all cursor-pointer relative ${
                        selectedIds.has(item.id!) 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => item.id && toggleSelection(item.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 line-clamp-1 pr-8">{item.name}</h4>
                        <span className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full ${getScoreColor(item.score)}`}>
                            {item.score}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        {item.rating && (
                            <span className="text-xs font-bold text-amber-600 flex items-center">
                                ★ {item.rating}
                            </span>
                        )}
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">{item.address}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags?.map((tag: string, i: number) => (
                              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  {tag}
                              </span>
                          ))}
                      </div>

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
                            Web
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
                            Map
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
    </div>
  );
};