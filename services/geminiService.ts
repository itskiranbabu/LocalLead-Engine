import { GoogleGenAI, Type } from "@google/genai";
import { BusinessLead, CampaignStrategy } from "../types";

// --- Rate Limiting Circuit Breaker ---
let isSystemCoolingDown = false;
let cooldownTimer: any = null;

const triggerCooldown = (seconds: number) => {
  if (isSystemCoolingDown) return;
  
  isSystemCoolingDown = true;
  console.warn(`System cooling down for ${seconds} seconds...`);
  
  // Dispatch event for UI components
  window.dispatchEvent(new CustomEvent('gemini-status-change', { 
    detail: { status: 'cooling', duration: seconds * 1000 } 
  }));

  cooldownTimer = setTimeout(() => {
    isSystemCoolingDown = false;
    window.dispatchEvent(new CustomEvent('gemini-status-change', { 
      detail: { status: 'online' } 
    }));
  }, seconds * 1000);
};

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

export const callWithRetry = async (apiCall: () => Promise<any>, maxRetries = 2): Promise<any> => {
  if (isSystemCoolingDown) {
    throw new Error("System is currently cooling down to manage AI quotas. Please try again in 30 seconds.");
  }

  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('Quota'))) {
        console.warn(`Hit rate limit (429). Retrying in ${delay}ms...`);
        
        // If it's the last retry, trigger the global circuit breaker
        if (i === maxRetries - 1) {
          triggerCooldown(30); // 30 second global pause
          throw new Error("API Quota Exceeded. System entering cooldown mode.");
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error("API Request Failed.");
};

export const searchBusinessesWithMaps = async (
  city: string,
  niche: string
): Promise<Partial<BusinessLead>[]> => {
  const ai = getAiClient();

  // Note: When using googleMaps tool, we CANNOT use responseMimeType: "application/json" or responseSchema.
  // We must ask for JSON in the prompt and parse the text manually.
  const prompt = `Find 5-10 real ${niche} businesses in ${city}, India.
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

  const response = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
    }
  }));

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

  const prompt = `Find contact info for "${lead.name}" in "${lead.city}".
  Output JSON: {"email": "string|null", "contactName": "string|null", "phone": "string|null", "notes": "string"}`;

  const response = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash", 
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  }));

  const text = response.text || "{}";
  let data: any = {};
  
  try {
    data = JSON.parse(cleanJson(text));
  } catch (e) {
    const match = text.match(/\{.*\}/s);
    if (match) {
        try { data = JSON.parse(match[0]); } catch (e2) {}
    }
  }

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

  const prompt = `Develop a cold outreach strategy for ${niche} in ${city}, India.
  Consider local market dynamics.
  Provide structured JSON output.`;

  const response = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-3-pro-preview", 
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 1024 }, // Reduced budget to save tokens/time for this demo
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
  }));

  return JSON.parse(response.text || "{}");
};

export const quickPolishEmail = async (
  draft: string
): Promise<string> => {
  const ai = getAiClient();

  const response = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `Polish this email draft for an Indian business audience. Professional, polite, concise. Draft: "${draft}"`,
  }));

  return response.text || draft;
};

// --- CONTENT SPARK BRAND DATA (INDIA EDITION) ---
const COMPANY_CONTEXT = `
You are the Head of Sales for "Content Spark", a premium digital growth agency in India.

OUR SERVICE PACKAGES & PRICING (INR):
1. SPARK STARTER (₹20,000/mo + GST)
   - 12 High-Quality Social Media Posts (IG/FB/LinkedIn)
   - Basic SEO Setup (Google Business Profile Optimization)
   - Monthly Performance Report
   - WhatsApp Support

2. BUSINESS IGNITE (₹45,000/mo + GST) - *Best Value*
   - 20 Social Posts + 4 Reels/Shorts
   - Advanced SEO (Keyword Research + 2 Blogs)
   - Paid Ads Management (Up to ₹50k ad spend included)
   - Bi-weekly Strategy Calls

3. BRAND DOMINATION (₹90,000/mo + GST)
   - Daily Content (Post + Story Management)
   - Full-Stack SEO (Backlinking + Technical Audit)
   - Complete Funnel Build & Optimization
   - Dedicated Account Manager
   - Unlimited Ad Spend Management

CORE VALUE PROPOSITION:
- We don't just post content; we build revenue engines.
- Data-driven approach suitable for the Indian market.
- 100% Transparency.

YOUR TONE:
- Professional, respectful, consultatitve.
- Use culturally appropriate greetings (e.g., "Hello Team", "Namaste", or addressing by name).
- Focus on ROI and solving local pain points (e.g., beating local competitors, getting more calls).
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
    
    TASK: Write a professional WhatsApp message to a potential client in India.
    LEAD: ${lead.name} (${lead.category} in ${lead.city}).
    OFFERING FOCUSED ON: ${offering}.

    GUIDELINES:
    - Start with "Hello [Name]" or "Namaste [Name]".
    - Mention "Content Spark" clearly.
    - Briefly mention the "Spark Starter" plan starting at ₹20,000/mo.
    - Use line breaks for readability on mobile.
    - Use 2-3 professional emojis (e.g., 🚀, 📈, 🙏).
    - End with a low-pressure question (e.g., "Can I share a quick PDF deck?").
    - Keep it under 100 words.
    
    Output strictly the message body text.`;
  } else {
    prompt = `
    ${COMPANY_CONTEXT}

    TASK: Write a high-converting cold email for an Indian business owner.
    LEAD: ${lead.name} (${lead.category} in ${lead.city}).
    OFFERING FOCUSED ON: ${offering}.
    GOAL: Book a 15-min discovery call.

    STRUCTURE:
    1. SUBJECT LINE: Professional & relevant to ${lead.city}.
    2. OPENER: Respectful observation about ${lead.name}.
    3. THE PROBLEM: A common pain point for ${lead.category} businesses in India.
    4. THE SOLUTION: Introduce Content Spark.
    5. THE OFFER: Mention tiered pricing (Starter at ₹20k, Scaling at ₹45k). Emphasize "Dedicated Support".
    6. CTA: Specific call to action.

    Output a JSON object with "subject" and "body" fields.
    `;
  }

  const response = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        responseMimeType: channel === 'email' ? "application/json" : "text/plain"
    }
  }));

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

// --- CONTENT CALENDAR GENERATOR ---
export const generateContentCalendar = async (lead: BusinessLead): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
    Act as a Social Media Strategist for the Indian market.
    Create a 5-day Content Calendar for "${lead.name}" (Niche: ${lead.category}, City: ${lead.city}).
    
    Focus on local trends, festivals, or common customer behaviors in ${lead.city}.
    
    Format:
    Day 1: [Post Idea] - [Caption Hook]
    Day 2: ...
    
    Keep it concise and high-value. Plain text output.
    `;

    const response = await callWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    }));

    return response.text || "Could not generate calendar.";
};