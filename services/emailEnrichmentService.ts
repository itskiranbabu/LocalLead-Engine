import axios from 'axios';

export interface EnrichmentResult {
  email: string | null;
  confidence: number;
  sources: string[];
  status: 'success' | 'failed' | 'no_match';
}

export const emailEnrichmentService = {
  async findEmail(
    domain: string,
    firstName?: string,
    lastName?: string,
    apiKey?: string
  ): Promise<EnrichmentResult> {
    if (!apiKey) {
      return { email: null, confidence: 0, sources: [], status: 'failed' };
    }

    try {
      const params: any = { domain };
      if (firstName) params.first_name = firstName;
      if (lastName) params.last_name = lastName;

      const response = await axios.get(
        'https://api.hunter.io/v2/email-finder',
        {
          params: {
            ...params,
            domain,
            limit: 1,
          },
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (response.data.data?.email) {
        return {
          email: response.data.data.email,
          confidence: response.data.data.confidence || 100,
          sources: response.data.data.sources || [],
          status: 'success',
        };
      }

      return {
        email: null,
        confidence: 0,
        sources: [],
        status: 'no_match',
      };
    } catch (error) {
      console.error('Email enrichment error:', error);
      return {
        email: null,
        confidence: 0,
        sources: [],
        status: 'failed',
      };
    }
  },

  validateEmail(email: string): boolean {
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    return emailRegex.test(email);
  },

  extractDomain(businessName: string, website?: string): string | null {
    if (website) {
      try {
        const url = new URL(website.startsWith('http') ? website : `https://${website}`);
        return url.hostname.replace('www.', '');
      } catch {
        return null;
      }
    }

    const domainGuess = businessName
      .toLowerCase()
      .replace(/s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    return domainGuess || null;
  },
};
