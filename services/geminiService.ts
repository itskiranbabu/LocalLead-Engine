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

export const generateMarketingPitch = async (
  lead: BusinessLead,
  offering: string,
  channel: 'email' | 'whatsapp'
): Promise<{ subject?: string; body: string }> => {
  const ai = getAiClient();

  let prompt = "";
  
  if (channel === 'whatsapp') {
    prompt = `Write a short, friendly, and professional WhatsApp message to ${lead.name} (a ${lead.category} in ${lead.city}).
    My company offers ${offering}.
    Goal: Start a conversation.
    Constraints: Under 60 words. No subject line. Use 1 or 2 relevant emojis. Don't be spammy.
    Output only the message body.`;
  } else {
    prompt = `Write a professional cold email to ${lead.name} (a ${lead.category} in ${lead.city}).
    My company offers ${offering}.
    Goal: Book a meeting.
    Constraints: Concise, persuasive, focus on value for the ${lead.category} niche.
    Output a JSON object with "subject" and "body" fields.`;
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