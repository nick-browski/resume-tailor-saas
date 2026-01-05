import { create } from "zustand";
import { WIZARD_CONSTANTS } from "@/shared/lib/constants";
import {
  getUrlParam,
  updateUrlParams,
  URL_QUERY_PARAMS,
} from "../lib/urlUtils";

export type WizardStep = 0 | 1 | 2 | 3;
export type Scenario = "edit" | "tailor" | null;

// Reads step from URL query parameters
export function getStepFromUrl(): WizardStep {
  const stepParam = getUrlParam(URL_QUERY_PARAMS.STEP);
  const stepNumber = stepParam ? parseInt(stepParam, 10) : null;

  if (
    stepNumber !== null &&
    stepNumber >= 0 &&
    stepNumber <= WIZARD_CONSTANTS.LAST_STEP_TAILOR_SCENARIO
  ) {
    return stepNumber as WizardStep;
  }

  return WIZARD_CONSTANTS.INITIAL_STEP;
}

// Reads scenario from URL query parameters
export function getScenarioFromUrl(): Scenario {
  const scenarioParam = getUrlParam(URL_QUERY_PARAMS.SCENARIO);
  if (scenarioParam === "edit" || scenarioParam === "tailor") {
    return scenarioParam;
  }
  return null;
}

// Reads documentId from URL query parameters
export function getDocumentIdFromUrl(): string | null {
  return getUrlParam(URL_QUERY_PARAMS.DOCUMENT_ID);
}

// Updates URL query parameter with current step
function updateUrlStep(step: WizardStep): void {
  // Setting step=0 explicitly supports direct URL navigation
  const stepValue = step.toString();
  updateUrlParams({ [URL_QUERY_PARAMS.STEP]: stepValue });
}

// Updates URL query parameter with scenario
function updateUrlScenario(scenario: Scenario): void {
  updateUrlParams({ [URL_QUERY_PARAMS.SCENARIO]: scenario });
}

// Updates URL query parameter with documentId
function updateUrlDocumentId(documentId: string | null): void {
  updateUrlParams({ [URL_QUERY_PARAMS.DOCUMENT_ID]: documentId });
}

interface WizardState {
  currentStep: WizardStep;
  maxReachedStep: WizardStep;
  selectedScenario: Scenario;
  documentId: string | null;
  resumeData: { file: File | null; text: string } | null;
  jobDescriptionText: string;
  editPrompt: string | null;
  uploadMode: "file" | "text";
  enableMatchCheck: boolean;
  generationToastId: string | null;
  parseToastId: string | null;
  setStep: (step: WizardStep) => void;
  setSelectedScenario: (scenario: Scenario) => void;
  setDocumentId: (documentId: string | null) => void;
  setResumeData: (data: { file: File | null; text: string } | null) => void;
  setJobDescriptionText: (text: string) => void;
  setEditPrompt: (prompt: string | null) => void;
  setUploadMode: (mode: "file" | "text") => void;
  setEnableMatchCheck: (enabled: boolean) => void;
  setMaxReachedStep: (step: WizardStep) => void;
  setGenerationToastId: (toastId: string | null) => void;
  setParseToastId: (toastId: string | null) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => {
  const initialStep = getStepFromUrl();
  const initialScenario = getScenarioFromUrl();

  return {
    currentStep: initialStep,
    maxReachedStep:
      initialStep === WIZARD_CONSTANTS.INITIAL_STEP
        ? WIZARD_CONSTANTS.FIRST_STEP
        : (initialStep as 1 | 2 | 3),
    selectedScenario:
      initialStep === WIZARD_CONSTANTS.INITIAL_STEP ? null : initialScenario,
    documentId: getDocumentIdFromUrl(),
    resumeData: null,
    jobDescriptionText: "",
    editPrompt: null,
    uploadMode: "file",
    enableMatchCheck: true,
    generationToastId: null,
    parseToastId: null,
    setStep: (step: WizardStep) => {
      if (step >= 0 && step <= WIZARD_CONSTANTS.LAST_STEP_TAILOR_SCENARIO) {
        set((state) => {
          // Allow navigation to any step that has been reached
          if (
            step === WIZARD_CONSTANTS.INITIAL_STEP ||
            step <= state.maxReachedStep
          ) {
            // If going to initial step, reset URL to contain only step parameter
            if (step === WIZARD_CONSTANTS.INITIAL_STEP) {
              updateUrlParams({
                [URL_QUERY_PARAMS.STEP]: step.toString(),
                [URL_QUERY_PARAMS.SCENARIO]: null,
                [URL_QUERY_PARAMS.DOCUMENT_ID]: null,
              });
              return {
                currentStep: step,
                selectedScenario: null,
                documentId: null,
              };
            }
            // Clear documentId when starting new flow (going to step 1 from initial step)
            const isStartingNewFlow =
              step === WIZARD_CONSTANTS.FIRST_STEP &&
              state.currentStep === WIZARD_CONSTANTS.INITIAL_STEP;
            if (isStartingNewFlow) {
              updateUrlParams({
                [URL_QUERY_PARAMS.STEP]: step.toString(),
                [URL_QUERY_PARAMS.DOCUMENT_ID]: null,
              });
              return { currentStep: step, documentId: null };
            }
            updateUrlStep(step);
            return { currentStep: step };
          }
          return state;
        });
      }
    },
    setSelectedScenario: (scenario: Scenario) => {
      updateUrlScenario(scenario);
      set({ selectedScenario: scenario });
    },
    setDocumentId: (documentId: string | null) => {
      updateUrlDocumentId(documentId);
      set({ documentId });
    },
    setResumeData: (data: { file: File | null; text: string } | null) => {
      set((state) => {
        // Reset maxReachedStep when a new file is loaded (to prevent navigation to Preview)
        if (data === null) {
          return { resumeData: data };
        }

        const isNewFileLoaded =
          data.file !== null &&
          (state.resumeData?.file === null ||
            state.resumeData?.file?.name !== data.file.name ||
            state.resumeData?.file?.size !== data.file.size);
        const isNewTextEntered =
          data.text.trim() !== "" && state.resumeData?.text !== data.text;

        if (isNewFileLoaded || isNewTextEntered) {
          // Reset to current step (or first step if on initial step)
          const newMaxReachedStep =
            state.currentStep === WIZARD_CONSTANTS.INITIAL_STEP
              ? WIZARD_CONSTANTS.FIRST_STEP
              : (state.currentStep as 1 | 2 | 3);
          return { resumeData: data, maxReachedStep: newMaxReachedStep };
        }
        return { resumeData: data };
      });
    },
    setJobDescriptionText: (text: string) => {
      set({ jobDescriptionText: text });
    },
    setEditPrompt: (prompt: string | null) => {
      set({ editPrompt: prompt });
    },
    setUploadMode: (mode: "file" | "text") => {
      set({ uploadMode: mode });
    },
    setEnableMatchCheck: (enabled: boolean) => {
      set({ enableMatchCheck: enabled });
    },
    setMaxReachedStep: (step: WizardStep) => {
      if (
        step >= WIZARD_CONSTANTS.FIRST_STEP &&
        step <= WIZARD_CONSTANTS.LAST_STEP_TAILOR_SCENARIO
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
        const maxStep =
          state.selectedScenario === "edit"
            ? WIZARD_CONSTANTS.LAST_STEP_EDIT_SCENARIO
            : WIZARD_CONSTANTS.LAST_STEP_TAILOR_SCENARIO;
        const newStep = Math.min(state.currentStep + 1, maxStep) as WizardStep;
        updateUrlStep(newStep);
        const updatedMaxReachedStep = Math.max(
          state.maxReachedStep,
          newStep === WIZARD_CONSTANTS.INITIAL_STEP
            ? WIZARD_CONSTANTS.FIRST_STEP
            : newStep
        ) as 1 | 2 | 3;
        return {
          currentStep: newStep,
          maxReachedStep: updatedMaxReachedStep,
        };
      }),
    previousStep: () =>
      set((state) => {
        const newStep = Math.max(
          state.currentStep - 1,
          WIZARD_CONSTANTS.INITIAL_STEP
        ) as WizardStep;
        // If going back to initial step, reset URL to contain only step parameter
        if (newStep === WIZARD_CONSTANTS.INITIAL_STEP) {
          updateUrlParams({
            [URL_QUERY_PARAMS.STEP]: newStep.toString(),
            [URL_QUERY_PARAMS.SCENARIO]: null,
            [URL_QUERY_PARAMS.DOCUMENT_ID]: null,
          });
          return {
            currentStep: newStep,
            selectedScenario: null,
            documentId: null,
            maxReachedStep: WIZARD_CONSTANTS.FIRST_STEP,
          };
        }
        updateUrlStep(newStep);
        return { currentStep: newStep };
      }),
    reset: () => {
      updateUrlParams({
        [URL_QUERY_PARAMS.STEP]: WIZARD_CONSTANTS.INITIAL_STEP.toString(),
        [URL_QUERY_PARAMS.SCENARIO]: null,
        [URL_QUERY_PARAMS.DOCUMENT_ID]: null,
      });
      set({
        currentStep: WIZARD_CONSTANTS.INITIAL_STEP,
        maxReachedStep: WIZARD_CONSTANTS.FIRST_STEP,
        selectedScenario: null,
        documentId: null,
        resumeData: null,
        jobDescriptionText: "",
        editPrompt: null,
        uploadMode: "file",
        enableMatchCheck: true,
        generationToastId: null,
        parseToastId: null,
      });
    },
  };
});
