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
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'initial' | 'followup';
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
}