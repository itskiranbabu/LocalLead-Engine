import { GoogleGenAI, Type } from "@google/genai";
import { BusinessLead, CampaignStrategy } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing. AI features will fail.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// Helper to clean JSON from markdown
const cleanJson = (text: string) => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean.trim();
};

export const searchBusinessesWithMaps = async (
  city: string,
  niche: string
): Promise<Partial<BusinessLead>[]> => {
  const ai = getAiClient();

  // Note: When using googleMaps tool, we CANNOT use responseMimeType: "application/json" or responseSchema.
  // We must ask for JSON in the prompt and parse the text manually.
  const prompt = `Find 5-10 real ${niche} businesses in ${city}.
  Use Google Maps to verify they exist.
  
  Strictly output a JSON array of objects. Do not include any markdown formatting or explanation outside the JSON.
  Each object must have these fields:
  - name (string)
  - address (string)
  - rating (number)
  - website (string or null)
  - phone (string or null)
  - snippet (string: brief description)
  
  Example format:
  [{"name": "Example", "address": "123 Main St", "rating": 4.5, "website": "...", "phone": "...", "snippet": "..."}]`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
    }
  });

  const text = response.text || "[]";
  let rawData: any[] = [];
  
  try {
    rawData = JSON.parse(cleanJson(text));
  } catch (e) {
    console.warn("Failed to parse JSON from Maps response:", text);
    // Fallback: try to find array in text
    const match = text.match(/\[.*\]/s);
    if (match) {
      try {
        rawData = JSON.parse(match[0]);
      } catch (e2) {}
    }
  }

  return rawData.map((item: any) => ({
    id: crypto.randomUUID(),
    name: item.name,
    address: item.address,
    city: city,
    rating: item.rating,
    website: item.website,
    phone: item.phone,
    category: niche,
    source: "Gemini Maps",
    status: "new",
    addedAt: new Date().toISOString(),
    notes: item.snippet,
  }));
};

export const enrichLeadData = async (
  lead: BusinessLead
): Promise<Partial<BusinessLead>> => {
  const ai = getAiClient();

  // Note: googleSearch tool also forbids responseSchema/MimeType.
  const prompt = `Find the public contact email or contact page URL for the business "${lead.name}" located in "${lead.city}".
  Also find the name of the owner or a key decision maker if publicly available.
  If phone number is missing, try to find it.
  Use Google Search Grounding to ensure accuracy.
  
  Strictly output a JSON object. Do not use markdown.
  Format:
  {
    "email": "string or null",
    "contactName": "string or null",
    "phone": "string or null",
    "notes": "string (brief info on source)"
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", 
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text || "{}";
  let data: any = {};
  
  try {
    data = JSON.parse(cleanJson(text));
  } catch (e) {
    console.warn("JSON parse error in enrichment:", text);
    const match = text.match(/\{.*\}/s);
    if (match) {
        try { data = JSON.parse(match[0]); } catch (e2) {}
    }
  }

  // Extract search grounding chunks for source verification
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  let sourceLinks = "";
  
  groundingChunks.forEach((chunk: any) => {
    if (chunk.web?.uri) {
      sourceLinks += ` ${chunk.web.uri}`;
    }
  });

  const notesWithSource = (data.notes || "") + (sourceLinks ? `\nSources:${sourceLinks}` : "");

  return {
    email: data.email || lead.email,
    phone: lead.phone || data.phone,
    notes: (lead.notes || "") + (notesWithSource ? `\n[Enrichment]: ${notesWithSource}` : "")
  };
};

export const generateCampaignStrategy = async (
  niche: string,
  city: string
): Promise<CampaignStrategy> => {
  const ai = getAiClient();

  const prompt = `Develop a comprehensive cold outreach strategy for targeting ${niche} in ${city}.
  Think deeply about the local market dynamics, potential pain points for this specific business type, and how to approach them effectively.
  Provide a structured JSON output.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview", 
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          targetAudience: { type: Type.STRING },
          painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          valuePropositions: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedSubjectLines: { type: Type.ARRAY, items: { type: Type.STRING } },
          outreachSchedule: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const quickPolishEmail = async (
  draft: string
): Promise<string> => {
  const ai = getAiClient();

  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `Polish this email draft to be more professional yet conversational. Keep it concise. Draft: "${draft}"`,
  });

  return response.text || draft;
};

// --- CONTENT SPARK BRAND DATA ---
const COMPANY_CONTEXT = `
You are the Head of Sales for "Content Spark". 
Content Spark is a premium digital growth agency.

OUR SERVICE PACKAGES & PRICING:
1. SPARK STARTER ($499/mo)
   - 12 High-Quality Social Media Posts (IG/FB/LinkedIn)
   - Basic SEO Setup (Google My Business Optimization)
   - Monthly Performance Report
   - Email Support

2. BUSINESS IGNITE ($999/mo) - *Most Popular*
   - 20 Social Posts + 4 Reels/Shorts
   - Advanced SEO (Keyword Research + 2 Blog Articles)
   - Paid Ads Management (Up to $1k ad spend included)
   - Bi-weekly Strategy Calls

3. BRAND DOMINATION ($1,999/mo)
   - Daily Content (Post + Story Management)
   - Full-Stack SEO (Backlinking + Technical Audit)
   - Complete Funnel Build & Optimization
   - Dedicated Account Manager & 24/7 Priority Support
   - Unlimited Ad Spend Management

CORE VALUE PROPOSITION:
- We don't just post content; we build revenue engines.
- Data-driven approach.
- 100% Transparency.

YOUR TONE:
- Professional, confident, consultative. Not pushy.
- Focus on ROI and solving the lead's specific pain points (e.g., getting more foot traffic, ranking higher on Maps).
`;

export const generateMarketingPitch = async (
  lead: BusinessLead,
  offering: string,
  channel: 'email' | 'whatsapp'
): Promise<{ subject?: string; body: string }> => {
  const ai = getAiClient();

  let prompt = "";
  
  if (channel === 'whatsapp') {
    prompt = `
    ${COMPANY_CONTEXT}
    
    TASK: Write a professional WhatsApp message to a potential client.
    LEAD: ${lead.name} (${lead.category} in ${lead.city}).
    OFFERING FOCUSED ON: ${offering}.

    GUIDELINES:
    - Start with a polite, professional greeting.
    - Mention "Content Spark" clearly.
    - Mention the "Spark Starter" plan starting at $499/mo as a low-friction entry point.
    - Use line breaks for readability.
    - Use 2-3 professional emojis (e.g., 🚀, 📈, ✨).
    - End with a low-pressure question (e.g., "Would you be open to seeing a quick plan?").
    - Keep it under 100 words.
    
    Output strictly the message body text.`;
  } else {
    prompt = `
    ${COMPANY_CONTEXT}

    TASK: Write a high-converting cold email.
    LEAD: ${lead.name} (${lead.category} in ${lead.city}).
    OFFERING FOCUSED ON: ${offering}.
    GOAL: Book a 15-min discovery call.

    STRUCTURE:
    1. SUBJECT LINE: Catchy, relevant to ${lead.city} or ${lead.category}.
    2. OPENER: Personalized observation about ${lead.name}.
    3. THE PROBLEM: A common pain point for ${lead.category} businesses (e.g., low visibility, relying on word of mouth).
    4. THE SOLUTION: Introduce Content Spark and how we fix this.
    5. THE OFFER: Briefly mention our tiered pricing to show transparency (Starter at $499, Scaling at $999). Mention "Dedicated Account Manager" support for higher tiers.
    6. CTA: Specific call to action.

    Output a JSON object with "subject" and "body" fields.
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        responseMimeType: channel === 'email' ? "application/json" : "text/plain"
    }
  });

  if (channel === 'whatsapp') {
    return { body: response.text || "" };
  } else {
      try {
        return JSON.parse(response.text || "{}");
      } catch (e) {
        return { subject: "Partnership Opportunity", body: response.text || "" };
      }
  }
};