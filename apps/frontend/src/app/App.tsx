import { useEffect } from "react";
import { Layout } from "@/widgets/layout";
import {
  Wizard,
  UploadResumeStep,
  JobDescriptionStep,
  PreviewStep,
} from "@/features/wizard";
import {
  useWizardStore,
  getStepFromUrl,
} from "@/features/wizard/model/wizardStore";
import { useDocumentStatusMonitor } from "@/features/wizard/hooks/useDocumentStatusMonitor";
import { WIZARD_CONSTANTS } from "@/shared/lib/constants";

function App() {
  const { currentStep, nextStep, previousStep, reset, setStep } =
    useWizardStore();

  // Monitors document status changes and shows toast notifications
  useDocumentStatusMonitor();

  // Sync step with URL on browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setStep(getStepFromUrl());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setStep]);

  const renderCurrentStep = (): React.ReactNode => {
    switch (currentStep) {
      case WIZARD_CONSTANTS.FIRST_STEP:
        return <UploadResumeStep onNext={nextStep} />;
      case 2:
        return <JobDescriptionStep onPrevious={previousStep} />;
      case WIZARD_CONSTANTS.LAST_STEP:
        return <PreviewStep onPrevious={previousStep} onReset={reset} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Wizard
        currentStep={currentStep}
        totalSteps={WIZARD_CONSTANTS.TOTAL_STEPS}
      >
        {renderCurrentStep()}
      </Wizard>
    </Layout>
  );
}

export default App;
