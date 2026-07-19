/**
 * Sequential scenario unlocking. Scenario order is data and lives elsewhere;
 * these functions take the ordered id list as input.
 */

export function isScenarioUnlocked(
  index: number,
  completedScenarioIds: string[],
  orderedIds: string[],
): boolean {
  if (index === 0) return true;
  if (index < 0 || index >= orderedIds.length) return false;
  return completedScenarioIds.includes(orderedIds[index - 1]);
}

export function nextScenarioId(
  completedScenarioIds: string[],
  orderedIds: string[],
): string | null {
  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    if (completedScenarioIds.includes(id)) continue;
    if (isScenarioUnlocked(index, completedScenarioIds, orderedIds)) {
      return id;
    }
  }
  return null;
}
