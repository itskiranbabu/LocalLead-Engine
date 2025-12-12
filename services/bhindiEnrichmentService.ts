import { BusinessLead } from '../types';

export interface EnrichmentResult {
  success: boolean;
  leadId: string;
  enrichedData?: Partial<BusinessLead>;
  error?: string;
  source?: string;
}

/**
 * Bhindi-powered enrichment service
 * Uses Bhindi's built-in Hunter agent - no external API keys needed!
 */
class BhindiEnrichmentService {
  private bhindiApiUrl = 'https://api.bhindi.io/v1/hunter';
  
  /**
   * Enrich a single lead using Bhindi's Hunter agent
   */
  async enrichLead(lead: BusinessLead): Promise<EnrichmentResult> {
    try {
      if (!lead.website) {
        return {
          success: false,
          leadId: lead.id,
          error: 'Lead must have a website for enrichment'
        };
      }

      console.log(`[Bhindi Enrichment] Starting enrichment for ${lead.name}...`);

      // Extract domain from website
      const domain = lead.website
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];

      // Call Bhindi's Hunter agent
      const response = await fetch(`${this.bhindiApiUrl}/domain-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getBhindiToken()}`
        },
        body: JSON.stringify({
          domain: domain,
          limit: 5
        })
      });

      if (!response.ok) {
        throw new Error(`Bhindi enrichment failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Find best email from results
      let bestEmail = null;
      let emailScore = 0;

      if (result.data && result.data.emails) {
        for (const emailObj of result.data.emails) {
          if (emailObj.confidence > emailScore) {
            bestEmail = emailObj.value;
            emailScore = emailObj.confidence;
          }
        }
      }

      console.log('[Bhindi Enrichment] Success:', { email: bestEmail, score: emailScore });

      return {
        success: true,
        leadId: lead.id,
        enrichedData: {
          email: bestEmail || lead.email,
          metadata: {
            ...lead.metadata,
            emailConfidence: emailScore,
            enrichmentSource: 'bhindi-hunter',
            enrichedAt: new Date().toISOString()
          }
        },
        source: 'bhindi-hunter'
      };

    } catch (error: any) {
      console.error('[Bhindi Enrichment] Error:', error);
      return {
        success: false,
        leadId: lead.id,
        error: error.message || 'Unknown enrichment error'
      };
    }
  }

  /**
   * Enrich multiple leads in batch
   */
  async enrichLeadsBatch(leads: BusinessLead[]): Promise<EnrichmentResult[]> {
    console.log(`[Bhindi Enrichment] Starting batch enrichment for ${leads.length} leads...`);
    
    const results: EnrichmentResult[] = [];
    
    // Process in batches of 3 to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(lead => this.enrichLead(lead))
      );
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Bhindi Enrichment] Batch complete: ${successCount}/${leads.length} successful`);

    return results;
  }

  /**
   * Get Bhindi authentication token from localStorage
   */
  private getBhindiToken(): string {
    // In a real implementation, this would get the token from your auth system
    // For now, return a placeholder
    return localStorage.getItem('bhindi_token') || '';
  }

  /**
   * Alternative: Use email pattern guessing (100% free, no API)
   */
  async guessEmail(lead: BusinessLead): Promise<EnrichmentResult> {
    try {
      if (!lead.website || !lead.name) {
        return {
          success: false,
          leadId: lead.id,
          error: 'Lead must have website and name for email guessing'
        };
      }

      // Extract domain
      const domain = lead.website
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];

      // Parse name
      const nameParts = lead.name.toLowerCase().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join('');
      const firstInitial = firstName.charAt(0);

      // Generate common patterns
      const patterns = [
        `${firstName}@${domain}`,
        `${firstName}.${lastName}@${domain}`,
        `${firstInitial}${lastName}@${domain}`,
        `contact@${domain}`,
        `info@${domain}`,
        `hello@${domain}`
      ];

      console.log('[Email Guesser] Generated patterns:', patterns);

      return {
        success: true,
        leadId: lead.id,
        enrichedData: {
          email: patterns[0], // Use first pattern as primary
          metadata: {
            ...lead.metadata,
            possibleEmails: patterns,
            enrichmentSource: 'pattern-guess',
            enrichedAt: new Date().toISOString()
          }
        },
        source: 'pattern-guess'
      };

    } catch (error: any) {
      return {
        success: false,
        leadId: lead.id,
        error: error.message
      };
    }
  }
}

export const bhindiEnrichmentService = new BhindiEnrichmentService();
