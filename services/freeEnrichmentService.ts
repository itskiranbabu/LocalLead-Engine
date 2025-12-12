import { BusinessLead } from '../types';

export interface EnrichmentResult {
  success: boolean;
  leadId: string;
  enrichedData?: Partial<BusinessLead>;
  error?: string;
  source?: string;
  possibleEmails?: string[];
}

/**
 * 100% FREE Email Enrichment Service
 * No API keys, no external services, works instantly!
 */
class FreeEnrichmentService {
  
  /**
   * Generate email addresses using common patterns
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

      console.log(`[Free Enrichment] Generating emails for ${lead.name}...`);

      // Extract domain from website
      const domain = this.extractDomain(lead.website);
      
      // Generate email patterns
      const patterns = this.generateEmailPatterns(lead.name, domain);
      
      // Select most likely email
      const primaryEmail = patterns[0];

      console.log('[Free Enrichment] Generated patterns:', patterns);

      return {
        success: true,
        leadId: lead.id,
        enrichedData: {
          email: primaryEmail,
          metadata: {
            ...lead.metadata,
            possibleEmails: patterns,
            emailConfidence: 75, // Pattern-based confidence
            enrichmentSource: 'pattern-generation',
            enrichedAt: new Date().toISOString()
          }
        },
        possibleEmails: patterns,
        source: 'pattern-generation'
      };

    } catch (error: any) {
      console.error('[Free Enrichment] Error:', error);
      return {
        success: false,
        leadId: lead.id,
        error: error.message || 'Unknown enrichment error'
      };
    }
  }

  /**
   * Extract clean domain from website URL
   */
  private extractDomain(website: string): string {
    return website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .toLowerCase();
  }

  /**
   * Generate common email patterns based on name and domain
   */
  private generateEmailPatterns(name: string, domain: string): string[] {
    const patterns: string[] = [];
    
    // Clean and parse name
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .trim();
    
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join('') || '';
    const firstInitial = firstName.charAt(0) || '';
    const lastInitial = lastName.charAt(0) || '';

    // Pattern 1: firstname@domain (most common for small businesses)
    if (firstName) {
      patterns.push(`${firstName}@${domain}`);
    }

    // Pattern 2: firstname.lastname@domain (very common)
    if (firstName && lastName) {
      patterns.push(`${firstName}.${lastName}@${domain}`);
    }

    // Pattern 3: firstinitiallastname@domain (common in corporates)
    if (firstInitial && lastName) {
      patterns.push(`${firstInitial}${lastName}@${domain}`);
    }

    // Pattern 4: firstnamelastname@domain (no separator)
    if (firstName && lastName) {
      patterns.push(`${firstName}${lastName}@${domain}`);
    }

    // Pattern 5: firstname_lastname@domain (underscore variant)
    if (firstName && lastName) {
      patterns.push(`${firstName}_${lastName}@${domain}`);
    }

    // Pattern 6: Generic business emails (fallback)
    patterns.push(`contact@${domain}`);
    patterns.push(`info@${domain}`);
    patterns.push(`hello@${domain}`);
    patterns.push(`admin@${domain}`);
    patterns.push(`support@${domain}`);

    // Remove duplicates and return
    return [...new Set(patterns)];
  }

  /**
   * Enrich multiple leads in batch
   */
  async enrichLeadsBatch(leads: BusinessLead[]): Promise<EnrichmentResult[]> {
    console.log(`[Free Enrichment] Batch enriching ${leads.length} leads...`);
    
    // Since this is instant (no API calls), we can process all at once
    const results = await Promise.all(
      leads.map(lead => this.enrichLead(lead))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`[Free Enrichment] Batch complete: ${successCount}/${leads.length} successful`);

    return results;
  }

  /**
   * Validate email format (basic check)
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get confidence score for an email pattern
   */
  getConfidenceScore(email: string, patterns: string[]): number {
    const index = patterns.indexOf(email);
    if (index === -1) return 0;
    
    // First pattern gets highest confidence
    const baseScore = 90 - (index * 10);
    return Math.max(baseScore, 50);
  }
}

export const freeEnrichmentService = new FreeEnrichmentService();
