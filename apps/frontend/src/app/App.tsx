import { useEffect, useCallback } from "react";
import { Layout } from "@/widgets/layout";
import { Wizard } from "@/features/wizard";
import {
  useWizardStore,
  getStepFromUrl,
  getScenarioFromUrl,
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
    setSelectedScenario,
    generationToastId,
    parseToastId,
  } = useWizardStore();
  const toast = useToastContext();

  // Monitors document status changes and shows toast notifications
  useDocumentStatusMonitor();

  // Sync step with URL on browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const urlStep = getStepFromUrl();
      const urlScenario = getScenarioFromUrl();
      setStep(urlStep);
      // If step is 0, clear scenario to show InitialStep
      if (urlStep === 0) {
        setSelectedScenario(null);
      } else if (urlScenario) {
        setSelectedScenario(urlScenario);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setStep, setSelectedScenario]);

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
