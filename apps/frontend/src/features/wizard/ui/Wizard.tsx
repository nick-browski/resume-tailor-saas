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
  const { maxReachedStep, setStep, documentId } = useWizardStore();
  const { data: currentDocument } = useDocumentById(documentId);
  const stepNumbers = Array.from(
    { length: totalSteps },
    (_, stepIndex) => (stepIndex + 1) as 1 | 2 | 3
  );

  const isGenerationInProgress =
    documentId !== null &&
    currentDocument?.status !== undefined &&
    currentDocument.status !== DOCUMENT_STATUS.GENERATED &&
    currentDocument.status !== DOCUMENT_STATUS.FAILED;

  const effectiveMaxStep =
    isGenerationInProgress && maxReachedStep >= WIZARD_CONSTANTS.LAST_STEP
      ? ((WIZARD_CONSTANTS.LAST_STEP - 1) as 1 | 2 | 3)
      : maxReachedStep;

  const handleStepClick = (clickedStepNumber: number) => {
    if (clickedStepNumber <= effectiveMaxStep) {
      setStep(clickedStepNumber as 1 | 2 | 3);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center justify-center">
          {stepNumbers.map((stepNumber) => {
            const isStepReached = stepNumber <= effectiveMaxStep;
            const isStepCurrent = stepNumber === currentStep;

            return (
              <Fragment key={stepNumber}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(stepNumber)}
                    disabled={!isStepReached}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all ${
                      isStepCurrent
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                        : isStepReached
                        ? "bg-blue-400 text-white hover:bg-blue-500 cursor-pointer hover:scale-110"
                        : "bg-gray-200 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {stepNumber}
                  </button>
                  {stepNumber < totalSteps && (
                    <div
                      className={`w-16 sm:w-32 h-1 mx-1 sm:mx-2 transition-colors ${
                        stepNumber < effectiveMaxStep
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
