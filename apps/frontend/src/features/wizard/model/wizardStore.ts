import { create } from "zustand";
import { WIZARD_CONSTANTS } from "@/shared/lib/constants";

export type WizardStep = 1 | 2 | 3;

interface WizardState {
  currentStep: WizardStep;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: WIZARD_CONSTANTS.FIRST_STEP,
  setStep: (step: WizardStep) => {
    if (
      step >= WIZARD_CONSTANTS.FIRST_STEP &&
      step <= WIZARD_CONSTANTS.LAST_STEP
    ) {
      set({ currentStep: step });
    }
  },
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(
        state.currentStep + 1,
        WIZARD_CONSTANTS.LAST_STEP
      ) as WizardStep,
    })),
  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(
        state.currentStep - 1,
        WIZARD_CONSTANTS.FIRST_STEP
      ) as WizardStep,
    })),
  reset: () => set({ currentStep: WIZARD_CONSTANTS.FIRST_STEP }),
}));
