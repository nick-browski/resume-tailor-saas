import { Fragment } from "react";
import { WIZARD_CONSTANTS, DOCUMENT_STATUS } from "@/shared/lib/constants";
import { useWizardStore } from "../model/wizardStore";
import { useDocumentById } from "../api/useDocuments";

interface WizardProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function Wizard({ currentStep, totalSteps, children }: WizardProps) {
  const { maxReachedStep, setStep, documentId, selectedScenario } =
    useWizardStore();
  const { data: currentDocument } = useDocumentById(documentId);

  if (currentStep === 0) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {children}
        </div>
      </div>
    );
  }

  const stepNumbers = Array.from(
    { length: totalSteps },
    (_, stepIndex) => (stepIndex + 1) as 1 | 2 | 3
  );

  const isGenerationInProgress =
    documentId !== null &&
    currentDocument?.status !== undefined &&
    currentDocument.status !== DOCUMENT_STATUS.GENERATED &&
    currentDocument.status !== DOCUMENT_STATUS.FAILED;

  const lastStepForScenario =
    selectedScenario === "edit"
      ? WIZARD_CONSTANTS.LAST_STEP_EDIT_SCENARIO
      : WIZARD_CONSTANTS.LAST_STEP_TAILOR_SCENARIO;

  const maxAccessibleStep =
    isGenerationInProgress && maxReachedStep >= lastStepForScenario
      ? ((lastStepForScenario - 1) as 1 | 2 | 3)
      : maxReachedStep;

  const handleStepClick = (clickedStepNumber: number) => {
    if (clickedStepNumber <= maxAccessibleStep) {
      setStep(clickedStepNumber as 1 | 2 | 3);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center justify-center">
          {stepNumbers.map((stepNumber) => {
            const isStepAccessible = stepNumber <= maxAccessibleStep;
            const isStepCurrent = stepNumber === currentStep;

            return (
              <Fragment key={stepNumber}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(stepNumber)}
                    disabled={!isStepAccessible}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all ${
                      isStepCurrent
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                        : isStepAccessible
                        ? "bg-blue-400 text-white hover:bg-blue-500 cursor-pointer hover:scale-110"
                        : "bg-gray-200 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {stepNumber}
                  </button>
                  {stepNumber < totalSteps && (
                    <div
                      className={`w-16 sm:w-32 h-1 mx-1 sm:mx-2 transition-colors ${
                        stepNumber < maxAccessibleStep
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">{children}</div>
    </div>
  );
}
