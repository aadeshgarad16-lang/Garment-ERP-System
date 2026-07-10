export function isStageMatch(actualStage: string | undefined | null, targetStages: string[]): boolean {
  if (!actualStage) return false;
  const normalized = actualStage.toLowerCase();
  return targetStages.some(target => normalized.includes(target.toLowerCase()));
}
