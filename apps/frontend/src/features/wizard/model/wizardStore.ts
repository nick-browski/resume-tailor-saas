import { create } from "zustand";
import { WIZARD_CONSTANTS } from "@/shared/lib/constants";

export type WizardStep = 1 | 2 | 3;

const STEP_QUERY_PARAM = "step";

// Reads step from URL query parameters
export function getStepFromUrl(): WizardStep {
  if (typeof window === "undefined") {
    return WIZARD_CONSTANTS.FIRST_STEP;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const stepParam = urlParams.get(STEP_QUERY_PARAM);
  const stepNumber = stepParam ? parseInt(stepParam, 10) : null;

  if (
    stepNumber &&
    stepNumber >= WIZARD_CONSTANTS.FIRST_STEP &&
    stepNumber <= WIZARD_CONSTANTS.LAST_STEP
  ) {
    return stepNumber as WizardStep;
  }

  return WIZARD_CONSTANTS.FIRST_STEP;
}

// Updates URL query parameter with current step
function updateUrlStep(step: WizardStep): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (step === WIZARD_CONSTANTS.FIRST_STEP) {
    url.searchParams.delete(STEP_QUERY_PARAM);
  } else {
    url.searchParams.set(STEP_QUERY_PARAM, step.toString());
  }

  window.history.pushState({}, "", url.toString());
}

interface WizardState {
  currentStep: WizardStep;
  documentId: string | null;
  resumeData: { file: File | null; text: string } | null;
  setStep: (step: WizardStep) => void;
  setDocumentId: (documentId: string | null) => void;
  setResumeData: (data: { file: File | null; text: string } | null) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: getStepFromUrl(),
  documentId: null,
  resumeData: null,
  setStep: (step: WizardStep) => {
    if (
      step >= WIZARD_CONSTANTS.FIRST_STEP &&
      step <= WIZARD_CONSTANTS.LAST_STEP
    ) {
      set({ currentStep: step });
      updateUrlStep(step);
    }
  },
  setDocumentId: (documentId: string | null) => {
    set({ documentId });
  },
  setResumeData: (data: { file: File | null; text: string } | null) => {
    set({ resumeData: data });
  },
  nextStep: () =>
    set((state) => {
      const newStep = Math.min(
        state.currentStep + 1,
        WIZARD_CONSTANTS.LAST_STEP
      ) as WizardStep;
      updateUrlStep(newStep);
      return { currentStep: newStep };
    }),
  previousStep: () =>
    set((state) => {
      const newStep = Math.max(
        state.currentStep - 1,
        WIZARD_CONSTANTS.FIRST_STEP
      ) as WizardStep;
      updateUrlStep(newStep);
      return { currentStep: newStep };
    }),
  reset: () => {
    updateUrlStep(WIZARD_CONSTANTS.FIRST_STEP);
    set({
      currentStep: WIZARD_CONSTANTS.FIRST_STEP,
      documentId: null,
      resumeData: null,
    });
  },
}));
