import { useEffect, useCallback } from "react";
import { Layout } from "@/widgets/layout";
import { Wizard } from "@/features/wizard";
import {
  useWizardStore,
  getStepFromUrl,
} from "@/features/wizard/model/wizardStore";
import { useDocumentStatusMonitor } from "@/features/wizard/hooks/useDocumentStatusMonitor";
import { useWizardStepRenderer } from "@/features/wizard/hooks/useWizardStepRenderer";
import { getTotalSteps } from "@/features/wizard/lib/wizardUtils";
import { useToastContext } from "@/app/providers/ToastProvider";

function App() {
  const {
    currentStep,
    selectedScenario,
    reset,
    setStep,
    generationToastId,
    parseToastId,
  } = useWizardStore();
  const toast = useToastContext();

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

  // Handle reset with toast dismissal
  const handleReset = useCallback(() => {
    if (generationToastId) {
      toast.dismissLoading(generationToastId);
    }
    if (parseToastId) {
      toast.dismissLoading(parseToastId);
    }
    reset();
  }, [generationToastId, parseToastId, toast, reset]);

  const { renderStep } = useWizardStepRenderer({ onReset: handleReset });
  const totalSteps = getTotalSteps(currentStep, selectedScenario);

  return (
    <Layout>
      <Wizard currentStep={currentStep} totalSteps={totalSteps}>
        {renderStep()}
      </Wizard>
    </Layout>
  );
}

export default App;
