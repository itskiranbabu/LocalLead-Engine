import React, { useEffect, useState } from 'react';
import { getLeads, updateLead } from '../services/storageService';
import { BusinessLead } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Users, Send, MessageSquare, TrendingUp, RefreshCcw, IndianRupee } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    contacted: 0,
    replied: 0,
    conversionRate: 0,
    pipelineValue: 0,
    byCity: [] as any[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const leads = getLeads();
    const total = leads.length;
    const contacted = leads.filter(l => l.status !== 'new').length;
    const replied = leads.filter(l => l.status === 'replied' || l.status === 'converted').length;
    
    // Calculate Pipeline Value (defaulting to 0 if undefined)
    const pipelineValue = leads.reduce((sum, lead) => sum + (lead.potentialValue || 0), 0);

    // Aggregate by city
    const cityCount = leads.reduce((acc: any, lead) => {
        acc[lead.city] = (acc[lead.city] || 0) + 1;
        return acc;
    }, {});
    
    const chartData = Object.keys(cityCount).map(city => ({
        name: city,
        leads: cityCount[city]
    })).slice(0, 5); // Top 5

    setStats({
        total,
        contacted,
        replied,
        pipelineValue,
        conversionRate: contacted ? Math.round((replied / contacted) * 100) : 0,
        byCity: chartData
    });
  };

  const simulateReplies = () => {
    setLoading(true);
    const leads = getLeads();
    const candidates = leads.filter(l => l.status === 'contacted');
    
    if (candidates.length === 0) {
        alert("No contacted leads available to simulate replies. Go to Outreach and send some emails first!");
        setLoading(false);
        return;
    }

    const count = Math.min(candidates.length, Math.floor(Math.random() * 3) + 1);
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    selected.forEach(l => {
        updateLead({ ...l, status: 'replied' });
    });

    setTimeout(() => {
        loadStats();
        setLoading(false);
        alert(`Simulated ${count} new replies!`);
    }, 800);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <button 
            onClick={simulateReplies}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Simulate Incoming Replies
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Pipeline Value</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-2">{formatCurrency(stats.pipelineValue)}</h3>
                </div>
                <div className="bg-green-100 p-2 rounded-lg text-green-700">
                    <IndianRupee size={20} />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Outreach Sent</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.contacted}</h3>
                </div>
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                    <Send size={20} />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Replies</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.replied}</h3>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <MessageSquare size={20} />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Reply Rate</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.conversionRate}%</h3>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <TrendingUp size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Leads by Top Cities</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col items-center justify-center text-center">
             <h4 className="text-lg font-bold text-slate-800 mb-2 w-full text-left">Pipeline Health</h4>
             {stats.total === 0 ? (
                 <p className="text-slate-400">No data available yet</p>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'New', value: stats.total - stats.contacted },
                                { name: 'Contacted', value: stats.contacted - stats.replied },
                                { name: 'Replied', value: stats.replied }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            <Cell fill="#cbd5e1" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#22c55e" />
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                </ResponsiveContainer>
             )}
        </div>
      </div>
    </div>
  );
};