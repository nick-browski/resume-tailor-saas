import { create } from "zustand";
import { WIZARD_CONSTANTS } from "@/shared/lib/constants";

export type WizardStep = 1 | 2 | 3;

const STEP_QUERY_PARAM = "step";
const DOCUMENT_ID_QUERY_PARAM = "docId";

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

// Reads documentId from URL query parameters
export function getDocumentIdFromUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(DOCUMENT_ID_QUERY_PARAM);
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

// Updates URL query parameter with documentId
function updateUrlDocumentId(documentId: string | null): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (documentId) {
    url.searchParams.set(DOCUMENT_ID_QUERY_PARAM, documentId);
  } else {
    url.searchParams.delete(DOCUMENT_ID_QUERY_PARAM);
  }

  window.history.pushState({}, "", url.toString());
}

interface WizardState {
  currentStep: WizardStep;
  maxReachedStep: WizardStep;
  documentId: string | null;
  resumeData: { file: File | null; text: string } | null;
  jobDescriptionText: string;
  uploadMode: "file" | "text";
  generationToastId: string | null;
  parseToastId: string | null;
  setStep: (step: WizardStep) => void;
  setDocumentId: (documentId: string | null) => void;
  setResumeData: (data: { file: File | null; text: string } | null) => void;
  setJobDescriptionText: (text: string) => void;
  setUploadMode: (mode: "file" | "text") => void;
  setMaxReachedStep: (step: WizardStep) => void;
  setGenerationToastId: (toastId: string | null) => void;
  setParseToastId: (toastId: string | null) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: getStepFromUrl(),
  maxReachedStep: getStepFromUrl(),
  documentId: getDocumentIdFromUrl(),
  resumeData: null,
  jobDescriptionText: "",
  uploadMode: "file",
  generationToastId: null,
  parseToastId: null,
  setStep: (step: WizardStep) => {
    if (
      step >= WIZARD_CONSTANTS.FIRST_STEP &&
      step <= WIZARD_CONSTANTS.LAST_STEP
    ) {
      set((state) => {
        // Allow navigation to any step that has been reached
        if (step <= state.maxReachedStep) {
          updateUrlStep(step);
          return { currentStep: step };
        }
        return state;
      });
    }
  },
  setDocumentId: (documentId: string | null) => {
    updateUrlDocumentId(documentId);
    set({ documentId });
  },
  setResumeData: (data: { file: File | null; text: string } | null) => {
    set({ resumeData: data });
  },
  setJobDescriptionText: (text: string) => {
    set({ jobDescriptionText: text });
  },
  setUploadMode: (mode: "file" | "text") => {
    set({ uploadMode: mode });
  },
  setMaxReachedStep: (step: WizardStep) => {
    if (
      step >= WIZARD_CONSTANTS.FIRST_STEP &&
      step <= WIZARD_CONSTANTS.LAST_STEP
    ) {
      set({ maxReachedStep: step });
    }
  },
  setGenerationToastId: (toastId: string | null) => {
    set({ generationToastId: toastId });
  },
  setParseToastId: (toastId: string | null) => {
    set({ parseToastId: toastId });
  },
  nextStep: () =>
    set((state) => {
      const newStep = Math.min(
        state.currentStep + 1,
        WIZARD_CONSTANTS.LAST_STEP
      ) as WizardStep;
      updateUrlStep(newStep);
      return {
        currentStep: newStep,
        maxReachedStep: Math.max(state.maxReachedStep, newStep) as WizardStep,
      };
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
    updateUrlDocumentId(null);
    set({
      currentStep: WIZARD_CONSTANTS.FIRST_STEP,
      maxReachedStep: WIZARD_CONSTANTS.FIRST_STEP,
      documentId: null,
      resumeData: null,
      jobDescriptionText: "",
      uploadMode: "file",
      generationToastId: null,
      parseToastId: null,
    });
  },
}));
