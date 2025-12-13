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
 * Works even WITHOUT website - generates from business name!
 */
class FreeEnrichmentService {
  
  /**
   * Generate email addresses using common patterns
   * Works with OR without website!
   */
  async enrichLead(lead: BusinessLead): Promise<EnrichmentResult> {
    try {
      console.log(`[Free Enrichment] Generating emails for ${lead.name}...`);

      let patterns: string[] = [];
      let domain: string;

      if (lead.website) {
        // If website exists, use it
        domain = this.extractDomain(lead.website);
        patterns = this.generateEmailPatterns(lead.name, domain);
      } else {
        // No website? Generate from business name!
        patterns = this.generateEmailsFromBusinessName(lead.name);
      }
      
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
            emailConfidence: lead.website ? 75 : 60, // Lower confidence without website
            enrichmentSource: lead.website ? 'pattern-generation' : 'business-name-generation',
            enrichedAt: new Date().toISOString()
          }
        },
        possibleEmails: patterns,
        source: lead.website ? 'pattern-generation' : 'business-name-generation'
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
   * Generate email patterns from business name (when no website)
   */
  private generateEmailsFromBusinessName(businessName: string): string[] {
    const patterns: string[] = [];
    
    // Clean business name
    const cleanName = businessName
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, '')
      .trim();

    // Common domain extensions
    const extensions = ['.com', '.in', '.co.in', '.net', '.org'];

    // Generate patterns for each extension
    extensions.forEach(ext => {
      const domain = cleanName + ext;
      
      // Pattern 1: info@businessname.com
      patterns.push(`info@${domain}`);
      
      // Pattern 2: contact@businessname.com
      patterns.push(`contact@${domain}`);
      
      // Pattern 3: hello@businessname.com
      patterns.push(`hello@${domain}`);
      
      // Pattern 4: support@businessname.com
      patterns.push(`support@${domain}`);
      
      // Pattern 5: sales@businessname.com
      patterns.push(`sales@${domain}`);
    });

    // Remove duplicates
    return [...new Set(patterns)];
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

    // Generic business emails (most common for businesses)
    patterns.push(`info@${domain}`);
    patterns.push(`contact@${domain}`);
    patterns.push(`hello@${domain}`);
    patterns.push(`support@${domain}`);
    patterns.push(`sales@${domain}`);

    // If we have name parts, add personal patterns
    if (firstName) {
      // Pattern: firstname@domain
      patterns.push(`${firstName}@${domain}`);
      
      if (lastName) {
        // Pattern: firstname.lastname@domain
        patterns.push(`${firstName}.${lastName}@${domain}`);
        
        // Pattern: firstinitiallastname@domain (jsmith@)
        patterns.push(`${firstInitial}${lastName}@${domain}`);
        
        // Pattern: firstname_lastname@domain
        patterns.push(`${firstName}_${lastName}@${domain}`);
        
        // Pattern: firstnamelastname@domain
        patterns.push(`${firstName}${lastName}@${domain}`);
        
        // Pattern: lastname.firstname@domain
        patterns.push(`${lastName}.${firstName}@${domain}`);
        
        // Pattern: firstinitiallastinitial@domain (js@)
        if (lastInitial) {
          patterns.push(`${firstInitial}${lastInitial}@${domain}`);
        }
      }
    }

    // Remove duplicates and return
    return [...new Set(patterns)];
  }
}

export const freeEnrichmentService = new FreeEnrichmentService();
