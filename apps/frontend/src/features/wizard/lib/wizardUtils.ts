import { WIZARD_CONSTANTS } from "@/shared/lib/constants";
import type { Scenario } from "../model/wizardStore";

export function getTotalSteps(
  currentStep: number,
  selectedScenario: Scenario | null
): number {
  if (currentStep === 0) {
    return WIZARD_CONSTANTS.TOTAL_STEPS_TAILOR_SCENARIO; // Default, not used on step 0
  }

  return selectedScenario === "edit"
    ? WIZARD_CONSTANTS.TOTAL_STEPS_EDIT_SCENARIO
    : WIZARD_CONSTANTS.TOTAL_STEPS_TAILOR_SCENARIO;
}
