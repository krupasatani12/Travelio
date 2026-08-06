/**
 * TravelIO — Mistral AI Service
 * Provides text chat and vision capabilities via Mistral API.
 */
const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');

const SYSTEM_PROMPT = `You are TravelBot, the AI travel assistant for TravelIO — India's smartest travel planning platform.

Your personality:
- Friendly, enthusiastic, and knowledgeable about Indian travel destinations
- You give concise, helpful answers (2-4 paragraphs max unless the user asks for detail)
- You use occasional emojis to be warm but not overwhelming
- You mention practical tips like best time to visit, budget estimates, and safety advice

Guidelines:
- ALWAYS prioritize the destination provided in the context field \`currentSubject\`. Answer ONLY about that destination.
- If you have no information for that destination, respond with: "Sorry, I don't have information about the requested destination at the moment."
- Do NOT mention or switch to unrelated places.
- NEVER use markdown strikethrough (~~text~~) in replies.
- Avoid hallucinating information not present in the dataset.
- Use the provided context naturally without stating "based on the context".`;

async function getSettings() {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({});
  }
  return settings;
}

/**
 * Chat with Mistral using text + context
 */
async function chat(userMessage, context = {}) {
  const settings = await getSettings();
  if (settings.mode === 'offline') {
    return `*(Offline Mode)* The system is currently in offline mode for maintenance. Chatbot is disabled.`;
  }

  let contextBlock = '';

  if (context.currentSubject) {
    contextBlock += `\nThe user is currently viewing: "${context.currentSubject}".`;
  }
  if (context.favorites && context.favorites.length > 0) {
    contextBlock += `\nThe user's favorite/saved places: ${context.favorites.join(', ')}.`;
  }
  if (context.preferences) {
    const p = context.preferences;
    if (p.travelStyle && p.travelStyle.length > 0) {
      contextBlock += `\nTravel style preferences: ${p.travelStyle.join(', ')}.`;
    }
    if (p.preferredClimate) {
      contextBlock += `\nPreferred climate: ${p.preferredClimate}.`;
    }
    if (p.budgetRange) {
      contextBlock += `\nBudget range: ₹${p.budgetRange.min} - ₹${p.budgetRange.max}.`;
    }
  }
  if (context.pageContext) {
    contextBlock += `\nThe user is on the "${context.pageContext}" page of the app.`;
  }

  const fullPrompt = `${SYSTEM_PROMPT}${contextBlock}\n\nUser: ${userMessage}`;

  if (!process.env.MISTRAL_API_KEY) {
    return `*(Offline Mode)* I couldn't reach my brain (the Mistral API). Please provide a MISTRAL_API_KEY in your .env file.`;
  }

  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: settings.llm.model || 'mistral-small-latest',
        temperature: settings.llm.temperature,
        max_tokens: settings.llm.maxTokens,
        top_p: settings.llm.topP,
        messages: [{ role: 'user', content: fullPrompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        timeout: 30000,
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("[Mistral API Error]", error.response?.data || error.message);
    return `*(Offline Mode)* I couldn't reach my brain (the Mistral API). Please check your API key or quota.`;
  }
}

/**
 * Identify a landmark from an image using Mistral Vision (pixtral-12b-2409)
 */
async function identifyLandmark(imageBuffer, mimeType = 'image/jpeg') {
  const settings = await getSettings();
  if (settings.mode === 'offline') {
    return { landmark_name: 'Unknown Landmark (Offline Mode)', description: 'System is currently offline.' };
  }

  if (!process.env.MISTRAL_API_KEY) {
    return { landmark_name: 'Unknown Landmark (Offline)', description: 'Mistral Vision API is disabled because MISTRAL_API_KEY is missing.' };
  }

  try {
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'pixtral-12b-2409',
        temperature: settings.llm.temperature,
        max_tokens: settings.llm.maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this landmark. Respond in exactly this JSON format: {"landmark_name": "Name of Landmark", "description": "A brief 1-2 sentence description including location and historical significance."}. If you cannot identify it, use landmark_name "Unknown Landmark".'
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl }
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("[Mistral Vision API Error]", error.response?.data || error.message);
  }

  return { landmark_name: 'Unknown Landmark (Error)', description: 'Failed to identify the landmark using Mistral Vision API.' };
}

/**
 * Generate a day-by-day itinerary
 */
async function generateItinerary(city, days, budget, vibes, places) {
  const settings = await getSettings();
  if (settings.mode === 'offline') {
    throw new Error('System is in offline mode. AI Trip Planner is disabled.');
  }

  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is missing');
  }

  const prompt = `You are an expert travel planner for India. Create a highly realistic, non-repeating ${days}-day itinerary for ${city} with a ${budget} budget.
The user enjoys these vibes: ${vibes.join(', ')}.
${places && places.length > 0 ? `The user has explicitly selected these places to include in their itinerary: ${places.join(', ')}. Make sure to include them and arrange them logically by day and time based on proximity and theme.` : ''}

CRITICAL SCHEDULING RULES:
- Distribute attractions logically across days based on geography and theme. Do NOT repeat the same pattern on every day.
- For each attraction include:
  • Realistic start & end time (e.g. 08:30 AM - 11:00 AM)
  • Visit duration (e.g. 2 hours)
  • Travel time & transport mode from previous stop (e.g. 20 mins auto-rickshaw)
  • Opening & closing hours (e.g. 09:00 AM - 06:00 PM or Open 24 Hours)
  • Meal breaks (Lunch/Dinner spots & local regional food recommendations)
  • Evening hotel return or departure transfer notes
  • Actual Google rating if known (e.g. 4.6), or null/undefined if unavailable. NEVER use fake or hardcoded default ratings.

Return ONLY a valid JSON object matching exactly this structure:
{
  "itinerary": [
    {
      "day": 1,
      "theme": "Theme of the day",
      "budget_estimate": "Estimated cost in INR",
      "places": [
        {
          "name": "Real attraction name in ${city}",
          "time": "Morning / Afternoon / Evening",
          "start_time": "08:30 AM",
          "end_time": "11:00 AM",
          "visit_duration": "2.5 Hours",
          "travel_time": "20 mins cab from hotel",
          "opening_hours": "08:00 AM – 06:00 PM",
          "meal_recommendation": "Try regional thali at local authentic diner",
          "hotel_return": "Return to hotel by 09:30 PM",
          "rating": 4.6,
          "description": "Short description of what to do here",
          "slug": "url-friendly-slug-of-place-name"
        }
      ]
    }
  ]
}
Generate ${days} days total.`;

  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: settings.llm.model || 'mistral-small-latest',
        temperature: settings.llm.temperature,
        max_tokens: 4096,
        top_p: settings.llm.topP,
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        timeout: 60000,
      }
    );
    const jsonStr = response.data.choices[0].message.content;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("[Mistral Itinerary API Error]", error.response?.data || error.message);
    throw new Error('Failed to generate itinerary');
  }
}

/**
 * Extend an existing itinerary
 */
async function extendItinerary(city, existingItinerary, extraDays, extraBudget, vibes) {
  const settings = await getSettings();
  if (settings.mode === 'offline') {
    throw new Error('System is in offline mode. AI Trip Planner is disabled.');
  }

  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is missing');
  }

  const currentDays = existingItinerary.itinerary.length;
  
  const prompt = `You are an expert travel planner for India. The user is visiting ${city} and has extended their trip by ${extraDays} days with an extra budget of ${extraBudget}.
The user enjoys these vibes: ${vibes.join(', ')}.

Here is their current itinerary for the first ${currentDays} days:
${JSON.stringify(existingItinerary.itinerary.map(d => d.places.map(p => p.name)), null, 2)}

Please suggest a plan for the NEXT ${extraDays} days (starting from day ${currentDays + 1}). DO NOT repeat places they have already visited.

Return ONLY a valid JSON object matching exactly this structure:
{
  "extended_days": [
    {
      "day": ${currentDays + 1},
      "theme": "Theme of the day",
      "budget_estimate": "Estimated cost in INR",
      "places": [
        {
          "name": "Name of the new place",
          "time": "Morning / Afternoon / Evening",
          "description": "Short description",
          "slug": "url-friendly-slug-of-place-name"
        }
      ]
    }
  ]
}`;

  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: settings.llm.model || 'mistral-small-latest',
        temperature: settings.llm.temperature,
        max_tokens: 4096,
        top_p: settings.llm.topP,
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        timeout: 60000,
      }
    );
    const jsonStr = response.data.choices[0].message.content;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("[Mistral Extend Itinerary API Error]", error.response?.data || error.message);
    throw new Error('Failed to extend itinerary');
  }
}

module.exports = { chat, identifyLandmark, generateItinerary, extendItinerary };
