export const categorySleeveRules: Record<string, string[]> = {
  'Shirt': ['Full Sleeve', 'Half Sleeve'],
  'Pant': ['Full Sleeve'],
  'T-Shirt': ['Half Sleeve'],
  'Jacket': ['Full Sleeve'],
  'Kurta': ['Half Sleeve'],
  'Salwar': ['Full Sleeve'],
  'Dupatta': ['Full Sleeve'],
  'Boiler Suit': ['Full Sleeve'],
};

/**
 * Validates if the given sleeve is valid for the given category.
 */
export function validateCategorySleeve(category: string, sleeve: string): boolean {
  // Normalize casing for checks
  const catKey = Object.keys(categorySleeveRules).find(
    (k) => k.toLowerCase() === category.toLowerCase()
  );

  if (!catKey) {
    // If category is not in our strict rules, we can assume it's valid or throw, 
    // but typically we'll allow it if there's no strict rule, 
    // or return false if we strictly want only known categories.
    // Let's assume strict validation: if it's not a known category, we don't validate sleeve.
    return true; 
  }

  const allowedSleeves = categorySleeveRules[catKey].map(s => s.toLowerCase());
  return allowedSleeves.includes(sleeve.toLowerCase());
}

/**
 * Gets the default fixed sleeve type for categories that only have one option.
 */
export function getDefaultSleeve(category: string): string | null {
  const catKey = Object.keys(categorySleeveRules).find(
    (k) => k.toLowerCase() === category.toLowerCase()
  );

  if (!catKey) return null;

  const allowedSleeves = categorySleeveRules[catKey];
  if (allowedSleeves.length === 1) {
    return allowedSleeves[0];
  }
  return null; // No single default (e.g., Shirt has multiple options)
}

/**
 * Resolves the garment sleeve, applying defaults or throwing validation errors.
 */
export function resolveGarmentSleeve(category: string, requestedSleeve?: string | null): string {
  const catKey = Object.keys(categorySleeveRules).find(
    (k) => k.toLowerCase() === category.toLowerCase()
  );

  if (!catKey) {
    return requestedSleeve || '';
  }

  const defaultSleeve = getDefaultSleeve(category);

  // If no sleeve was requested, try to fallback to the default
  if (!requestedSleeve || requestedSleeve.trim() === '') {
    if (defaultSleeve) {
      return defaultSleeve;
    }
    throw new Error(`Sleeve type is required for category "${category}"`);
  }

  // Validate requested sleeve
  if (!validateCategorySleeve(category, requestedSleeve)) {
    throw new Error(`Invalid sleeve type "${requestedSleeve}" for category "${category}"`);
  }

  // To return the exact casing defined in our rules instead of what user provided:
  const allowedSleeves = categorySleeveRules[catKey];
  const matchedSleeve = allowedSleeves.find(s => s.toLowerCase() === requestedSleeve.toLowerCase());

  return matchedSleeve || requestedSleeve;
}
