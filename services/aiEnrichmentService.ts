import { BusinessLead, EmailTemplate } from '../types';

// This service uses Gemini AI for advanced lead enrichment and scoring

/**
 * Score a lead based on multiple factors using AI
 * Returns a score from 0-100
 */
export const scoreLeadWithAI = async (
  lead: BusinessLead,
  geminiApiKey: string
): Promise<{
  score: number;
  reasoning: string;
  factors: {
    digitalPresence: number;
    businessSize: number;
    growthPotential: number;
    targetMatch: number;
  };
}> => {
  try {
    const prompt = `
Analyze this business lead and provide a comprehensive lead score (0-100):

Business Details:
- Name: ${lead.name}
- Category: ${lead.category || 'Unknown'}
- City: ${lead.city || 'Unknown'}
- Website: ${lead.website || 'None'}
- Phone: ${lead.phone ? 'Yes' : 'No'}
- Email: ${lead.email ? 'Yes' : 'No'}
- Rating: ${lead.rating || 'N/A'}
- Review Count: ${lead.reviewCount || 0}

Scoring Criteria:
1. Digital Presence (0-25): Website quality, online reviews, social media
2. Business Size (0-25): Review count, rating, market presence
3. Growth Potential (0-25): Industry trends, location, category
4. Target Match (0-25): How well they match ideal customer profile

Provide response in JSON format:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>",
  "factors": {
    "digitalPresence": <0-25>,
    "businessSize": <0-25>,
    "growthPotential": <0-25>,
    "targetMatch": <0-25>
  }
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }

    // Fallback scoring
    return {
      score: 50,
      reasoning: 'Unable to generate AI score, using default',
      factors: {
        digitalPresence: 12,
        businessSize: 12,
        growthPotential: 13,
        targetMatch: 13,
      },
    };
  } catch (error) {
    console.error('AI scoring error:', error);
    return {
      score: 50,
      reasoning: 'Error in AI scoring',
      factors: {
        digitalPresence: 12,
        businessSize: 12,
        growthPotential: 13,
        targetMatch: 13,
      },
    };
  }
};

/**
 * Generate hyper-personalized email using AI
 */
export const generateHyperPersonalizedEmail = async (
  lead: BusinessLead,
  template: EmailTemplate,
  geminiApiKey: string,
  context?: {
    recentNews?: string;
    competitorAnalysis?: string;
    industryTrends?: string;
  }
): Promise<{
  subject: string;
  body: string;
  personalizationScore: number;
}> => {
  try {
    const prompt = `
Create a highly personalized cold email for this business:

Business Details:
- Name: ${lead.name}
- Category: ${lead.category}
- City: ${lead.city}
- Website: ${lead.website || 'Unknown'}

Template to personalize:
Subject: ${template.subject}
Body: ${template.body}

Additional Context:
${context?.recentNews ? `- Recent News: ${context.recentNews}` : ''}
${context?.competitorAnalysis ? `- Competitors: ${context.competitorAnalysis}` : ''}
${context?.industryTrends ? `- Industry Trends: ${context.industryTrends}` : ''}

Requirements:
1. Keep the core message from the template
2. Add 2-3 specific details about their business
3. Reference their location or industry
4. Include a relevant insight or trend
5. Keep it under 150 words
6. Maintain professional but friendly tone
7. Include a clear, specific call-to-action

Provide response in JSON format:
{
  "subject": "<personalized subject line>",
  "body": "<personalized email body>",
  "personalizationScore": <0-100>
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }

    // Fallback to template
    return {
      subject: template.subject,
      body: template.body,
      personalizationScore: 30,
    };
  } catch (error) {
    console.error('Email personalization error:', error);
    return {
      subject: template.subject,
      body: template.body,
      personalizationScore: 0,
    };
  }
};

/**
 * Analyze email reply sentiment and intent
 */
export const analyzeReply = async (
  replyText: string,
  geminiApiKey: string
): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'interested' | 'not_interested' | 'needs_more_info' | 'objection';
  urgency: 'high' | 'medium' | 'low';
  suggestedAction: string;
  keyPoints: string[];
}> => {
  try {
    const prompt = `
Analyze this email reply and provide insights:

Reply: "${replyText}"

Provide analysis in JSON format:
{
  "sentiment": "<positive|neutral|negative>",
  "intent": "<interested|not_interested|needs_more_info|objection>",
  "urgency": "<high|medium|low>",
  "suggestedAction": "<what to do next>",
  "keyPoints": ["<key point 1>", "<key point 2>"]
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      sentiment: 'neutral',
      intent: 'needs_more_info',
      urgency: 'medium',
      suggestedAction: 'Follow up with more information',
      keyPoints: [],
    };
  } catch (error) {
    console.error('Reply analysis error:', error);
    return {
      sentiment: 'neutral',
      intent: 'needs_more_info',
      urgency: 'medium',
      suggestedAction: 'Review manually',
      keyPoints: [],
    };
  }
};

/**
 * Generate follow-up email sequence
 */
export const generateFollowupSequence = async (
  lead: BusinessLead,
  initialEmail: string,
  geminiApiKey: string,
  sequenceLength: number = 5
): Promise<
  Array<{
    day: number;
    subject: string;
    body: string;
    purpose: string;
  }>
> => {
  try {
    const prompt = `
Create a ${sequenceLength}-email follow-up sequence for this lead:

Business: ${lead.name}
Category: ${lead.category}
City: ${lead.city}

Initial Email Sent:
"${initialEmail}"

Create a sequence with these purposes:
1. Day 3: Value-add follow-up (share helpful resource)
2. Day 7: Case study or success story
3. Day 14: Different angle or benefit
4. Day 21: Last attempt with urgency
5. Day 28: Break-up email (permission to close)

For each email, provide:
{
  "day": <number>,
  "subject": "<subject line>",
  "body": "<email body>",
  "purpose": "<what this email aims to achieve>"
}

Return as JSON array.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '[]';
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback sequence
    return [
      {
        day: 3,
        subject: 'Quick follow-up',
        body: 'Hi, just following up on my previous email...',
        purpose: 'Gentle reminder',
      },
    ];
  } catch (error) {
    console.error('Sequence generation error:', error);
    return [];
  }
};

/**
 * Suggest response to a reply
 */
export const suggestResponse = async (
  originalEmail: string,
  reply: string,
  geminiApiKey: string
): Promise<{
  professional: string;
  friendly: string;
  direct: string;
}> => {
  try {
    const prompt = `
Generate 3 response options to this email reply:

Original Email:
"${originalEmail}"

Their Reply:
"${reply}"

Provide 3 response styles in JSON:
{
  "professional": "<formal, business-like response>",
  "friendly": "<warm, conversational response>",
  "direct": "<brief, to-the-point response>"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      professional: 'Thank you for your response. I would be happy to discuss this further.',
      friendly: 'Thanks for getting back to me! Would love to chat more about this.',
      direct: 'Thanks. When can we schedule a call?',
    };
  } catch (error) {
    console.error('Response suggestion error:', error);
    return {
      professional: 'Thank you for your response.',
      friendly: 'Thanks for getting back!',
      direct: 'Thanks. Let me know.',
    };
  }
};

/**
 * Predict best follow-up time
 */
export const predictBestFollowupTime = async (
  lead: BusinessLead,
  geminiApiKey: string
): Promise<{
  nextFollowupDate: string;
  bestTimeOfDay: string;
  confidence: number;
  reasoning: string;
}> => {
  try {
    const prompt = `
Predict the best time to follow up with this lead:

Business: ${lead.name}
Category: ${lead.category}
City: ${lead.city}
Last Contact: ${lead.lastContactDate || 'Never'}

Consider:
- Industry norms for ${lead.category}
- Business hours in ${lead.city}
- Typical response patterns

Provide in JSON:
{
  "nextFollowupDate": "<YYYY-MM-DD>",
  "bestTimeOfDay": "<morning|afternoon|evening>",
  "confidence": <0-100>,
  "reasoning": "<brief explanation>"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Default: 3 days from now, morning
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    
    return {
      nextFollowupDate: nextDate.toISOString().split('T')[0],
      bestTimeOfDay: 'morning',
      confidence: 50,
      reasoning: 'Default 3-day follow-up',
    };
  } catch (error) {
    console.error('Follow-up prediction error:', error);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    
    return {
      nextFollowupDate: nextDate.toISOString().split('T')[0],
      bestTimeOfDay: 'morning',
      confidence: 0,
      reasoning: 'Error in prediction',
    };
  }
};