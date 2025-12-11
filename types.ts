export interface BusinessLead {
  id: string;
  name: string;
  address: string;
  city: string;
  rating?: number;
  reviews?: number;
  website?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'replied' | 'converted' | 'ignored';
  source: string;
  category: string;
  email?: string; // Enriched data
  notes?: string;
  addedAt: string;
  mapUrl?: string; // Google Maps grounding URL
  campaignId?: string; // Associated campaign
  
  // Advanced CRM Fields
  potentialValue?: number; // Maps to pipeline_value_inr
  score?: number;
  tags?: string[];
  enrichmentData?: any;
  deepResearch?: {
    lastRun: string;
    iceBreakers: string[];
    news: string[];
    summary: string;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'initial' | 'followup';
  channel?: 'email' | 'whatsapp';
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  niche: string;
  location: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface CampaignStrategy {
  targetAudience: string;
  painPoints: string[];
  valuePropositions: string[];
  suggestedSubjectLines: string[];
  outreachSchedule: string;
}

export interface AppSettings {
  userName: string;
  companyName: string;
  dailyEmailLimit: number;
  offerings: string[]; // List of services the user sells
  googleSheetsConnected?: boolean;
  googleSheetId?: string;
    enrichmentService?: 'hunter' | 'apollo' | 'clearbit' | null;
  enrichmentApiKey?: string;
  enrichmentEnabled?: boolean;
}

export interface SearchHistoryItem {
  id: string;
  city: string;
  niche: string;
  date: string;
  resultCount: number;
}
