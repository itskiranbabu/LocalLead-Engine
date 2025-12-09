import { BusinessLead, EmailTemplate, AppSettings, Campaign } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { leadRepository } from './repositories/leadRepository';
import { campaignRepository } from './repositories/campaignRepository';
import { templateRepository } from './repositories/templateRepository';
import { profileRepository } from './repositories/profileRepository';

const KEYS = {
  LEADS: 'lle_leads',
  TEMPLATES: 'lle_templates',
  SETTINGS: 'lle_settings',
  CAMPAIGNS: 'lle_campaigns',
};

// Helper to check auth and get ID
const getCurrentUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase!.auth.getSession();
  return data.session?.user?.id || null;
};

// --- Leads ---
export const getLeads = async (): Promise<BusinessLead[]> => {
  const userId = await getCurrentUserId();
  if (userId) {
    return await leadRepository.getAll(userId);
  } else {
    const data = localStorage.getItem(KEYS.LEADS);
    return data ? JSON.parse(data) : [];
  }
};

export const addLeads = async (newLeads: BusinessLead[]) => {
  const userId = await getCurrentUserId();
  if (userId) {
    // Check duplication in DB? Repository creates blindly, but UI handles duplication check usually.
    // For now, let's just insert.
    await leadRepository.create(userId, newLeads);
  } else {
    // Local Logic
    const currentData = localStorage.getItem(KEYS.LEADS);
    const current: BusinessLead[] = currentData ? JSON.parse(currentData) : [];
    const uniqueNew = newLeads.filter(
      (nl) => !current.some((cl) => cl.name === nl.name && cl.city === nl.city)
    );
    localStorage.setItem(KEYS.LEADS, JSON.stringify([...current, ...uniqueNew]));
  }
};

export const updateLead = async (updatedLead: BusinessLead) => {
  const userId = await getCurrentUserId();
  if (userId) {
    await leadRepository.update(userId, updatedLead);
  } else {
    const currentData = localStorage.getItem(KEYS.LEADS);
    const current: BusinessLead[] = currentData ? JSON.parse(currentData) : [];
    const index = current.findIndex((l) => l.id === updatedLead.id);
    if (index !== -1) {
      current[index] = updatedLead;
      localStorage.setItem(KEYS.LEADS, JSON.stringify(current));
    }
  }
};

export const deleteLead = async (id: string) => {
    const userId = await getCurrentUserId();
    if (userId) {
        await leadRepository.delete(userId, id);
    } else {
        const currentData = localStorage.getItem(KEYS.LEADS);
        const current: BusinessLead[] = currentData ? JSON.parse(currentData) : [];
        const filtered = current.filter(l => l.id !== id);
        localStorage.setItem(KEYS.LEADS, JSON.stringify(filtered));
    }
};

// --- Campaigns ---
export const getCampaigns = async (): Promise<Campaign[]> => {
  const userId = await getCurrentUserId();
  if (userId) {
    return await campaignRepository.getAll(userId);
  } else {
    const data = localStorage.getItem(KEYS.CAMPAIGNS);
    return data ? JSON.parse(data) : [];
  }
};

export const saveCampaign = async (campaign: Campaign) => {
  const userId = await getCurrentUserId();
  if (userId) {
    // Basic check if exists (naive, assumes ID is new if from UI create)
    // Actually repository 'create' handles inserts. We need to distinguish update vs create.
    // For simplicity, we'll try to update, if fail/not exist? 
    // Better: check if we have it in list?
    // Let's assume UI passes ID. We can try to upsert or check ID.
    // For this prototype, if it's new (created just now), use create.
    const exists = (await campaignRepository.getAll(userId)).find(c => c.id === campaign.id);
    if (exists) {
        await campaignRepository.update(userId, campaign);
    } else {
        await campaignRepository.create(userId, campaign);
    }
  } else {
    const current = await getCampaigns(); // Local call
    const index = current.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
      current[index] = campaign;
    } else {
      current.push(campaign);
    }
    localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(current));
  }
};

export const deleteCampaign = async (id: string) => {
  const userId = await getCurrentUserId();
  if (userId) {
    await campaignRepository.delete(userId, id);
  } else {
    const current = await getCampaigns();
    const filtered = current.filter(c => c.id !== id);
    localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(filtered));
  }
};

// --- Templates ---
export const getTemplates = async (): Promise<EmailTemplate[]> => {
  const userId = await getCurrentUserId();
  if (userId) {
    const remote = await templateRepository.getAll(userId);
    if (remote.length === 0) return await getLocalDefaultTemplates(); // Return defaults if empty
    return remote;
  } else {
    const data = localStorage.getItem(KEYS.TEMPLATES);
    if (data) return JSON.parse(data);
    return await getLocalDefaultTemplates();
  }
};

const getLocalDefaultTemplates = async (): Promise<EmailTemplate[]> => {
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

export const saveTemplate = async (template: EmailTemplate) => {
  const userId = await getCurrentUserId();
  if (userId) {
    // Naive Upsert Check
    const exists = (await templateRepository.getAll(userId)).find(t => t.id === template.id);
    if (exists) await templateRepository.update(userId, template);
    else await templateRepository.create(userId, template);
  } else {
    const current = await getTemplates();
    const index = current.findIndex(t => t.id === template.id);
    if (index >= 0) {
      current[index] = template;
    } else {
      current.push(template);
    }
    localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(current));
  }
};

export const deleteTemplate = async (id: string) => {
    const userId = await getCurrentUserId();
    if (userId) {
        await templateRepository.delete(userId, id);
    } else {
        const current = await getTemplates();
        const filtered = current.filter(t => t.id !== id);
        localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(filtered));
    }
};

// --- Settings ---
export const getSettings = async (): Promise<AppSettings> => {
  const userId = await getCurrentUserId();
  const defaultSettings: AppSettings = {
    userName: '',
    companyName: 'Content Spark',
    dailyEmailLimit: 50,
    offerings: [
      'Social Media Marketing',
      'Local SEO (GMB)',
      'Lead Generation Ads',
      'Web Design & Dev'
    ],
    googleSheetsConnected: false
  };

  if (userId) {
    const remote = await profileRepository.getSettings(userId);
    return remote || defaultSettings;
  } else {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings) => {
  const userId = await getCurrentUserId();
  if (userId) {
    await profileRepository.updateSettings(userId, settings);
  } else {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
};