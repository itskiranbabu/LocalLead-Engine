import { BusinessLead } from '../types';
import { getSettings } from './storageService';

export interface EnrichmentResult {
  success: boolean;
  leadId: string;
  enrichedData?: Partial<BusinessLead>;
  error?: string;
  source?: string;
}

class N8NEnrichmentService {
  /**
   * Enrich a single lead using N8N workflow
   */
  async enrichLead(lead: BusinessLead): Promise<EnrichmentResult> {
    try {
      const settings = await getSettings();
      
      if (!settings.n8nEnrichmentWebhook) {
        return {
          success: false,
          leadId: lead.id,
          error: 'N8N enrichment webhook not configured in Settings'
        };
      }

      if (!lead.website) {
        return {
          success: false,
          leadId: lead.id,
          error: 'Lead must have a website for enrichment'
        };
      }

      console.log(`[N8N Enrichment] Starting enrichment for ${lead.name}...`);

      const response = await fetch(settings.n8nEnrichmentWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          website: lead.website,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          category: lead.category
        })
      });

      if (!response.ok) {
        throw new Error(`N8N enrichment failed: ${response.statusText}`);
      }

      const result = await response.json();

      console.log('[N8N Enrichment] Success:', result);

      return {
        success: true,
        leadId: lead.id,
        enrichedData: {
          email: result.email || lead.email,
          phone: result.phone || lead.phone,
          // Add any additional enriched fields from N8N
          ...(result.emailConfidence && { 
            metadata: { 
              ...lead.metadata,
              emailConfidence: result.emailConfidence,
              enrichmentSource: result.enrichmentSource,
              enrichedAt: result.enrichedAt
            } 
          })
        },
        source: result.enrichmentSource || 'n8n'
      };

    } catch (error: any) {
      console.error('[N8N Enrichment] Error:', error);
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
    console.log(`[N8N Enrichment] Starting batch enrichment for ${leads.length} leads...`);
    
    const results: EnrichmentResult[] = [];
    
    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(lead => this.enrichLead(lead))
      );
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[N8N Enrichment] Batch complete: ${successCount}/${leads.length} successful`);

    return results;
  }

  /**
   * Test N8N enrichment webhook connection
   */
  async testConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          leadId: 'test-connection',
          name: 'Test Lead',
          website: 'https://example.com'
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'N8N enrichment webhook is working correctly!'
        };
      } else {
        return {
          success: false,
          message: `Webhook returned error: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
}

export const n8nEnrichmentService = new N8NEnrichmentService();
