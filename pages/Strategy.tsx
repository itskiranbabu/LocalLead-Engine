import React, { useState } from 'react';
import { BrainCircuit, Loader2, Target, CheckCircle } from 'lucide-react';
import { generateCampaignStrategy } from '../services/geminiService';
import { CampaignStrategy } from '../types';

export const Strategy: React.FC = () => {
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStrategy(null);
    try {
      const result = await generateCampaignStrategy(niche, city);
      setStrategy(result);
    } catch (err) {
      alert("Error generating strategy. Ensure API Configuration is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <BrainCircuit className="text-purple-600" size={32} />
          AI Campaign Strategist
        </h2>
        <p className="text-slate-500">
            Uses Gemini 3.0 Pro (Thinking Mode) to reason deeply about your target market.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleGenerate} className="flex gap-4 items-end">
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Target City</label>
                <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Seattle"
                    required
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Niche</label>
                <input
                    type="text"
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Yoga Studios"
                    required
                />
            </div>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" /> : 'Think & Plan'}
            </button>
        </form>
      </div>

      {strategy && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target size={18} className="text-purple-500" /> Target Audience Profile
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">{strategy.targetAudience}</p>
                
                <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3">Key Pain Points</h4>
                <ul className="space-y-2">
                    {strategy.painPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-red-400 mt-1">•</span> {pt}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                <h3 className="font-bold text-slate-800 mb-4">Value Proposition & Angles</h3>
                <ul className="space-y-3 mb-6">
                    {strategy.valuePropositions.map((vp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                            <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                            {vp}
                        </li>
                    ))}
                </ul>

                <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3">Recommended Subject Lines</h4>
                 <ul className="space-y-2">
                    {strategy.suggestedSubjectLines.map((sub, i) => (
                        <li key={i} className="text-sm font-medium text-slate-800 border-b border-slate-100 pb-2 last:border-0">
                            "{sub}"
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
                 <h3 className="font-bold text-slate-800 mb-2">Execution Schedule</h3>
                 <p className="text-slate-700">{strategy.outreachSchedule}</p>
            </div>
        </div>
      )}
    </div>
  );
};