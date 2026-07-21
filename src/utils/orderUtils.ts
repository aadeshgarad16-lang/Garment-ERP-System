export function isStageMatch(actualStage: string | undefined | null, targetStages: string[]): boolean {
  if (!actualStage) return false;
  const normalized = actualStage.toLowerCase();
  return targetStages.some(target => normalized.includes(target.toLowerCase()));
}

const standardSizeOrder: Record<string, number> = {
  'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, 'XXXL': 7, '3XL': 7, '4XL': 8, '5XL': 9, 'STANDARD': 0
};

export function compareSizes(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  const numA = parseInt(a);
  const numB = parseInt(b);
  
  const isNumA = !isNaN(numA);
  const isNumB = !isNaN(numB);

  if (isNumA && isNumB) {
    return numA - numB;
  } else if (isNumA) {
    return -1; // Numbers first
  } else if (isNumB) {
    return 1; // Letters second
  } else {
    const orderA = standardSizeOrder[a.toUpperCase()] || 99;
    const orderB = standardSizeOrder[b.toUpperCase()] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  }
}

export function sortSizesAscending(sizes: string[]): string[] {
  return [...sizes].sort(compareSizes);
}
