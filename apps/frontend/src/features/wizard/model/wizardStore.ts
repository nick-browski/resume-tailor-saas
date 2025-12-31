import { create } from "zustand";

export type WizardStep = 1 | 2 | 3;

interface WizardState {
  currentStep: WizardStep;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

const TOTAL_STEPS = 3;

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 1,
  setStep: (step) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      set({ currentStep: step });
    }
  },
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) as WizardStep,
    })),
  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1) as WizardStep,
    })),
  reset: () => set({ currentStep: 1 }),
}));

