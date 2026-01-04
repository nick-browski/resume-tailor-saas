import { Fragment, useState, useEffect, useRef } from "react";
import {
  WIZARD_CONSTANTS,
  DOCUMENT_STATUS,
  ANIMATION_CONSTANTS,
} from "@/shared/lib/constants";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousStepRef = useRef(currentStep);
  const slideDirectionRef = useRef<"forward" | "backward">("forward");
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle step transitions with animation
  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      // Determine slide direction before animation starts
      slideDirectionRef.current =
        currentStep > previousStepRef.current ? "forward" : "backward";

      // Start exit animation
      setIsAnimating(true);

      // After exit animation completes, update content and start enter animation
      animationTimeoutRef.current = setTimeout(() => {
        setDisplayChildren(children);
        previousStepRef.current = currentStep;

        // Start enter animation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsAnimating(false);
          });
        });
      }, ANIMATION_CONSTANTS.WIZARD_STEP_TRANSITION_DURATION_MS);
    } else {
      // No step change, just update children
      setDisplayChildren(children);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [currentStep, children]);

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

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 relative overflow-hidden">
        <div
          key={currentStep}
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating
              ? `translateX(${
                  slideDirectionRef.current === "forward" ? "20px" : "-20px"
                })`
              : "translateX(0)",
            transition: `opacity ${ANIMATION_CONSTANTS.WIZARD_STEP_TRANSITION_DURATION_MS}ms ${ANIMATION_CONSTANTS.WIZARD_STEP_EASING}, transform ${ANIMATION_CONSTANTS.WIZARD_STEP_TRANSITION_DURATION_MS}ms ${ANIMATION_CONSTANTS.WIZARD_STEP_EASING}`,
            willChange: "opacity, transform",
          }}
        >
          {displayChildren}
        </div>
      </div>
    </div>
  );
}
