import { useWizardStore } from "../model/wizardStore";
import { SCENARIO } from "@/shared/lib/constants";
import { InitialStep } from "../ui/steps/initial-step";
import { EditResumeStep } from "../ui/steps/upload-step";
import { EditPreviewStep } from "../ui/steps/edit-step";
import { JobDescriptionStep } from "../ui/steps/job-description-step";
import { PreviewStep } from "../ui/steps/preview-step";

interface UseWizardStepRendererProps {
  onReset: () => void;
}

export function useWizardStepRenderer({ onReset }: UseWizardStepRendererProps) {
  const {
    currentStep,
    selectedScenario,
    nextStep,
    previousStep,
    setSelectedScenario,
    setStep,
    setDocumentId,
  } = useWizardStore();

  const renderStep = () => {
    if (currentStep === 0 || !selectedScenario) {
      return (
        <InitialStep
          onSelectEdit={() => {
            setDocumentId(null);
            setSelectedScenario(SCENARIO.EDIT);
            setStep(1);
          }}
          onSelectTailor={() => {
            setDocumentId(null);
            setSelectedScenario(SCENARIO.TAILOR);
            setStep(1);
          }}
        />
      );
    }

    if (selectedScenario === SCENARIO.EDIT) {
      switch (currentStep) {
        case 1:
          return <EditResumeStep onNext={nextStep} onPrevious={previousStep} />;
        case 2:
          return (
            <EditPreviewStep onPrevious={previousStep} onReset={onReset} />
          );
        default:
          return null;
      }
    }

    if (selectedScenario === SCENARIO.TAILOR) {
      switch (currentStep) {
        case 1:
          return <JobDescriptionStep onPrevious={previousStep} />;
        case 2:
          return <PreviewStep onPrevious={previousStep} onReset={onReset} />;
        default:
          return null;
      }
    }

    return null;
  };

  return { renderStep };
}
