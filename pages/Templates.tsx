import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { getTemplates, saveTemplate, deleteTemplate } from '../services/storageService';
import { EmailTemplate } from '../types';

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setTemplates(await getTemplates());
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setFormData(template);
  };

  const handleCreate = () => {
    const newId = crypto.randomUUID();
    setEditingId(newId);
    setFormData({
      id: newId,
      name: 'New Template',
      subject: '',
      body: 'Hi {{contact_name}},\n\n...',
      type: 'initial'
    });
  };

  const handleSave = async () => {
    if (formData.id && formData.name && formData.subject && formData.body) {
      await saveTemplate(formData as EmailTemplate);
      setEditingId(null);
      setFormData({});
      await loadTemplates();
    } else {
      alert("Please fill in all fields.");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate(id);
      await loadTemplates();
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Email Templates</h2>
          <p className="text-slate-500">Create reusable outreach scripts</p>
        </div>
        {!editingId && (
          <button 
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            New Template
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* List */}
        <div className={`flex-1 overflow-y-auto ${editingId ? 'hidden md:block md:w-1/3 md:flex-none' : 'w-full'}`}>
          <div className="grid grid-cols-1 gap-4">
            {templates.map(t => (
              <div 
                key={t.id}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  editingId === t.id 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:shadow-md'
                }`}
                onClick={() => !editingId && handleEdit(t)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800">{t.name}</h3>
                  {editingId !== t.id && (
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="text-slate-400 hover:text-blue-600">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">Subject: {t.subject}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{t.body}</p>
                <div className="mt-3">
                   <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${t.type === 'initial' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                     {t.type}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {editingId && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700">Edit Template</h3>
                <div className="flex gap-2">
                   <button onClick={handleCancel} className="text-slate-500 hover:bg-slate-200 p-2 rounded-full">
                     <X size={20} />
                   </button>
                </div>
             </div>
             
             <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                   <input 
                      type="text" 
                      value={formData.name || ''} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
                
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                            value={formData.type || 'initial'}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="initial">Initial Outreach</option>
                            <option value="followup">Follow-up</option>
                        </select>
                    </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Subject Line</label>
                   <input 
                      type="text" 
                      value={formData.subject || ''} 
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div className="flex-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email Body</label>
                   <p className="text-xs text-slate-400 mb-2">Available variables: {'{{business_name}}, {{contact_name}}, {{city}}, {{your_name}}, {{your_company}}'}</p>
                   <textarea 
                      value={formData.body || ''} 
                      onChange={e => setFormData({...formData, body: e.target.value})}
                      className="w-full h-64 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                   />
                </div>
             </div>

             <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Template
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};