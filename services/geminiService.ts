
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerateItineraryResponse, GroundingChunk, Activity, DayItinerary, parseCostToNumber } from '../types';

/**
 * Parses the Markdown itinerary text into a structured DayItinerary array.
 * Expected Markdown format:
 * # Day X: [Location]
 * ## Activity Name
 * * Hours: [HH:MM - HH:MM]
 * * Estimated Cost: [Currency Amount]
 * * Details: [Description]
 */
const parseMarkdownItinerary = (markdown: string): DayItinerary[] => {
  const days: DayItinerary[] = [];
  const dayRegex = /# Day (\d+): (.+)/g;
  const activityRegex = /## (.+?)\n\s*\*\s*Hours:\s*(.+?)\n\s*\*\s*Estimated Cost:\s*(.+?)(?:\n\s*\*\s*Details:\s*(.+?))?(?=\n##|$|# Day)/gs;

  let currentDay: DayItinerary | undefined;
  let dayMatch;

  const lines = markdown.split('\n');
  let markdownWithoutGrounding = '';
  // Remove grounding from the markdown content.
  for (const line of lines) {
    if (line.trim().startsWith('[')) {
      continue;
    }
    markdownWithoutGrounding += line + '\n';
  }

  const sections = markdownWithoutGrounding.split(/(# Day \d+:.+)/).filter(Boolean);

  for (const section of sections) {
    if (section.startsWith('# Day')) {
      dayMatch = section.match(/# Day (\d+): (.+)/);
      if (dayMatch) {
        const dayNumber = parseInt(dayMatch[1], 10);
        const location = dayMatch[2].trim();
        currentDay = { day: dayNumber, location: location, activities: [] };
        days.push(currentDay);
      }
    } else if (currentDay) {
      const activityMatches = section.matchAll(activityRegex);
      for (const match of activityMatches) {
        const [, name, hours, estimatedCostString, description] = match;
        const { value: estimatedCostValue } = parseCostToNumber(estimatedCostString.trim());
        currentDay.activities.push({
          name: name.trim(),
          hours: hours.trim(),
          estimatedCost: estimatedCostString.trim(),
          estimatedCostValue: estimatedCostValue,
          description: description ? description.trim() : '',
        });
      }
    }
  }

  return days;
};

export const generateItinerary = async (
  destination: string,
  duration: number,
  interests: string
): Promise<GenerateItineraryResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined. Please ensure it's set in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-2.5-flash';

  const prompt = `You are a professional, helpful, and creative Travel Planner AI.
  Create a detailed, day-by-day travel itinerary for a trip to ${destination} for ${duration} days,
  focused on ${interests}.

  For each activity, include:
  1.  **Activity Name**: The name of the place or activity.
  2.  **Hours**: Opening and closing hours (e.g., "09:00 AM - 05:00 PM"). If not applicable, state "N/A".
  3.  **Estimated Cost**: An estimated cost in the local currency (e.g., "IDR 50,000" or "USD 20"). If free, state "Free".
  4.  **Details**: A brief description of the activity.

  Format the output strictly in Markdown as follows:

  # Day X: [Location for Day X]

  ## [Activity Name 1]
  *   Hours: [HH:MM AM/PM - HH:MM AM/PM or N/A]
  *   Estimated Cost: [Currency Amount or Free]
  *   Details: [Brief description of activity 1.]

  ## [Activity Name 2]
  *   Hours: [HH:MM AM/PM - HH:MM AM/PM or N/A]
  *   Estimated Cost: [Currency Amount or Free]
  *   Details: [Brief description of activity 2.]

  ... (continue for all activities for Day X)

  # Day Y: [Location for Day Y]

  ... (continue for all days)

  Always use real-time, current information when suggesting activities, attractions, and estimated costs.
  The currency must be consistent for all estimated costs throughout the itinerary. For ${destination}, use its local currency.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.8, // Slightly higher temperature for creativity in suggestions
        maxOutputTokens: 2000,
        thinkingConfig: { thinkingBudget: 1000 },
      },
    });

    const fullText = response.text;
    if (!fullText) {
      throw new Error("No text response received from Gemini API.");
    }

    const itinerary = parseMarkdownItinerary(fullText);

    const sourceUrls: GroundingChunk[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
            if (chunk.web) {
                sourceUrls.push({ web: chunk.web });
            }
        }
    }

    return { itinerary, sourceUrls };

  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw new Error(`Failed to generate itinerary: ${(error as Error).message}`);
  }
};
