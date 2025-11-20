
export interface Activity {
  name: string;
  hours: string;
  estimatedCost: string; // Original string from AI, e.g., "IDR 50,000"
  estimatedCostValue: number; // Numeric value for calculations, e.g., 50000
  description: string;
  actualCost?: number; // New: User-entered actual cost
}

export interface DayItinerary {
  day: number;
  location?: string;
  activities: Activity[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GenerateItineraryResponse {
  itinerary: DayItinerary[];
  sourceUrls: GroundingChunk[];
}

export interface GenerateItineraryError {
  message: string;
  details?: string;
}

/**
 * Parses a cost string (e.g., "IDR 50,000", "USD 20", "Free") into a number and extracts currency.
 * Handles both comma and dot as decimal separators and removes thousands separators.
 * @param costString The string containing the cost.
 * @returns An object with the numeric value and the currency code (or null if not found).
 */
export function parseCostToNumber(costString: string): { value: number; currency: string | null } {
  costString = costString.trim();
  if (costString.toLowerCase() === 'free') {
    return { value: 0, currency: null };
  }

  // Attempt to extract currency code first (e.g., IDR, USD)
  const currencyMatch = costString.match(/([A-Z]{2,3})\s*([\d,\.]+)/i);
  let currency: string | null = null;
  let numericPart = costString;

  if (currencyMatch && currencyMatch[1]) {
    currency = currencyMatch[1].toUpperCase();
    numericPart = currencyMatch[2]; // Use only the numeric part for parsing
  }

  // Remove all non-numeric characters except for one potential decimal separator
  // First, remove thousands separators (., or ,) based on common patterns
  let cleanedNumeric = numericPart.replace(/\s/g, ''); // Remove spaces

  // Heuristic: If there's a comma AND a dot, assume dot is decimal if it's the LAST one, else comma is decimal.
  // Or, if only one type exists, that's the decimal.
  const hasComma = cleanedNumeric.includes(',');
  const hasDot = cleanedNumeric.includes('.');

  if (hasComma && hasDot) {
    if (cleanedNumeric.indexOf(',') < cleanedNumeric.indexOf('.')) { // e.g., 1.000,00 (dot is thousands, comma is decimal)
      cleanedNumeric = cleanedNumeric.replace(/\./g, ''); // Remove thousands dots
      cleanedNumeric = cleanedNumeric.replace(',', '.'); // Change comma to decimal dot
    } else { // e.g., 1,000.00 (comma is thousands, dot is decimal)
      cleanedNumeric = cleanedNumeric.replace(/,/g, ''); // Remove thousands commas
    }
  } else if (hasComma) { // Only comma, assume it's decimal
    cleanedNumeric = cleanedNumeric.replace(',', '.');
  }
  // If only dot, assume it's decimal (no change needed)

  const value = parseFloat(cleanedNumeric);

  return { value: isNaN(value) ? 0 : value, currency };
}
