import React from "react";

interface WizardProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function Wizard({ currentStep, totalSteps, children }: WizardProps) {
  const stepNumbers = Array.from(
    { length: totalSteps },
    (_, index) => index + 1
  );

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center justify-center">
          {stepNumbers.map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all ${
                    stepNumber <= currentStep
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < totalSteps && (
                  <div
                    className={`w-16 sm:w-32 h-1 mx-1 sm:mx-2 transition-colors ${
                      stepNumber < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">{children}</div>
    </div>
  );
}
