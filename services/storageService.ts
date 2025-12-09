import { BusinessLead, EmailTemplate, AppSettings, Campaign } from '../types';

const KEYS = {
  LEADS: 'lle_leads',
  TEMPLATES: 'lle_templates',
  SETTINGS: 'lle_settings',
  CAMPAIGNS: 'lle_campaigns',
};

// --- Leads ---
export const getLeads = (): BusinessLead[] => {
  const data = localStorage.getItem(KEYS.LEADS);
  return data ? JSON.parse(data) : [];
};

export const saveLeads = (leads: BusinessLead[]) => {
  localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
};

export const addLeads = (newLeads: BusinessLead[]) => {
  const current = getLeads();
  // Simple deduplication based on name + city
  const uniqueNew = newLeads.filter(
    (nl) => !current.some((cl) => cl.name === nl.name && cl.city === nl.city)
  );
  saveLeads([...current, ...uniqueNew]);
};

export const updateLead = (updatedLead: BusinessLead) => {
  const current = getLeads();
  const index = current.findIndex((l) => l.id === updatedLead.id);
  if (index !== -1) {
    current[index] = updatedLead;
    saveLeads(current);
  }
};

// --- Campaigns ---
export const getCampaigns = (): Campaign[] => {
  const data = localStorage.getItem(KEYS.CAMPAIGNS);
  return data ? JSON.parse(data) : [];
};

export const saveCampaigns = (campaigns: Campaign[]) => {
  localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(campaigns));
};

export const saveCampaign = (campaign: Campaign) => {
  const current = getCampaigns();
  const index = current.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    current[index] = campaign;
  } else {
    current.push(campaign);
  }
  saveCampaigns(current);
};

export const deleteCampaign = (id: string) => {
  const current = getCampaigns();
  const filtered = current.filter(c => c.id !== id);
  saveCampaigns(filtered);
  
  // Optional: Remove campaignId from leads associated with this campaign
  const leads = getLeads();
  const updatedLeads = leads.map(l => l.campaignId === id ? { ...l, campaignId: undefined } : l);
  saveLeads(updatedLeads);
};

// --- Templates ---
export const getTemplates = (): EmailTemplate[] => {
  const data = localStorage.getItem(KEYS.TEMPLATES);
  if (data) return JSON.parse(data);
  return [
    {
      id: 'default-1',
      name: 'Content Spark - Introduction',
      subject: 'Igniting growth for {{business_name}}',
      body: "Hi {{contact_name}},\n\nI've been following {{business_name}}'s progress in {{city}} and see massive potential to dominate the local market.\n\nAt Content Spark, we don't just post content; we build revenue engines. I've prepared a few ideas specifically for the {{category}} niche.\n\nAre you open to a 5-minute chat this week?\n\nBest,\n{{your_name}}\nContent Spark",
      type: 'initial'
    }
  ];
};

export const saveTemplates = (templates: EmailTemplate[]) => {
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
};

export const saveTemplate = (template: EmailTemplate) => {
  const current = getTemplates();
  const index = current.findIndex(t => t.id === template.id);
  if (index >= 0) {
    current[index] = template;
  } else {
    current.push(template);
  }
  saveTemplates(current);
};

export const deleteTemplate = (id: string) => {
  const current = getTemplates();
  const filtered = current.filter(t => t.id !== id);
  saveTemplates(filtered);
};

// --- Settings ---
export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : {
    userName: '',
    companyName: 'Content Spark',
    dailyEmailLimit: 50,
    offerings: [
      'Social Media Marketing',
      'Local SEO (GMB)',
      'Lead Generation Ads',
      'Web Design & Dev'
    ]
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};